import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, activeFirebaseConfig } from '../lib/firebase';
import { ensureAdminAuth } from './adminService';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// Clean in-memory cache for fast display
const localImageUrlMap = new Map<string, string>();

/**
 * Resolves an image URL: if the url is a base64 Data URL or standard URL, returns it.
 */
export function getCachedImageUrl(url?: string | null): string {
  if (!url) return '';
  if (localImageUrlMap.has(url)) {
    return localImageUrlMap.get(url)!;
  }
  return url;
}

/**
 * Convertit un fichier image en chaîne base64 (Data URL) via FileReader et readAsDataURL().
 * Utilise une Promise pour garantir une exécution asynchrone (async/await) avant la sauvegarde.
 */
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validation du fichier
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) {
        resolve('');
        return;
      }

      // Si le fichier est déjà léger (< 350 Ko) ou est un SVG/GIF, on conserve le base64 brut
      if (
        file.size <= 350 * 1024 ||
        file.type === 'image/svg+xml' ||
        file.type === 'image/gif'
      ) {
        resolve(rawBase64);
        return;
      }

      // Pour les photos volumineuses (ex: smartphone 5 à 15 Mo), nous ajustons
      // le canvas pour que la chaîne base64 tienne facilement dans Firestore (limite de 1 Mo par doc)
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawBase64);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Rendu en JPEG haute qualité
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(optimizedBase64 || rawBase64);
        } catch {
          resolve(rawBase64);
        }
      };
      img.onerror = () => resolve(rawBase64);
      img.src = rawBase64;
    };

    reader.onerror = (error) => {
      console.error('Erreur FileReader readAsDataURL:', error);
      reject(new Error(`Impossible de lire le fichier "${file.name}" en base64.`));
    };

    // Lecture asynchrone du fichier en base64 (Data URL)
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads/converts a product image directly to a persistent base64 Data URL.
 * Attend que la conversion soit terminée via async/await avant de retourner.
 * Ne dépend d'aucune URL blob temporaire (createObjectURL).
 */
export async function uploadProductImage(
  file: File,
  _productId?: string,
  index?: number
): Promise<string> {
  const tStart = performance.now();
  console.log(`[WATCH IMAGE] Conversion base64: Début lecture image #${(index ?? 0) + 1} (${file.name}, ${(file.size / 1024).toFixed(1)} Ko)`);
  
  // 1. Validation de la taille maximale (20 Mo)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const errorMsg = `Le fichier "${file.name}" dépasse la taille maximale autorisée de 20 Mo (${(file.size / (1024 * 1024)).toFixed(1)} Mo).`;
    console.error(`[WATCH IMAGE] Validation error:`, errorMsg);
    throw new Error(errorMsg);
  }

  // 2. Validation du type MIME
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
  
  if (!hasValidExtension && !hasValidMime) {
    const errorMsg = `Format de fichier non autorisé pour "${file.name}". Formats acceptés : JPG, PNG, WebP, GIF, SVG.`;
    console.error(`[WATCH IMAGE] Validation error:`, errorMsg);
    throw new Error(errorMsg);
  }

  // 3. Conversion systématique en base64 Data URL via FileReader.readAsDataURL()
  const base64DataUrl = await convertFileToBase64(file);
  console.log(`[WATCH IMAGE] Conversion base64 terminée en ${(performance.now() - tStart).toFixed(1)}ms`);

  return base64DataUrl;
}

/**
 * Compresses an image file client-side to an optimized Data URL.
 * Resizes large dimensions to maxDim (1280px default), keeping aspect ratio.
 * Yields clean, lightweight (60-150KB) WebP or JPEG images that load instantly
 * and preserve high-end horological clarity without huge payload overhead.
 */
export function compressImageToDataUrl(file: File, maxDim = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    // If SVG or animated GIF, keep as raw data url
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try webp first, fallback to jpeg
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression fallback to raw data URL:', canvasErr);
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file to Firebase Storage under the products or branding directory
 * Performs strict client-side validation of MIME type, extension, and file size.
 * Uses a safe timeout and falls back seamlessly to an optimized HD data URL if Storage is offline.
 */
export async function uploadImageFile(file: File, folder: 'products' | 'branding' | 'categories' = 'products'): Promise<string> {
  // 1. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Le fichier dépasse la taille maximale autorisée de 20 Mo.');
  }

  // 2. Validate MIME type or extension
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
  
  if (!hasValidExtension && !hasValidMime) {
    throw new Error('Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, GIF, SVG.');
  }

  // 3. Immediately prepare the optimized high-resolution client version
  const optimizedDataUrl = await compressImageToDataUrl(file, 1280, 0.85);

  try {
    const timestamp = Date.now();
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const storagePath = `${folder}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    // Strict 2-second timeout to never block UI if Storage is unconfigured or slow
    const uploadTask = uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: cleanFileName
      }
    }).then(snapshot => getDownloadURL(snapshot.ref));

    const timeoutTask = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 2000)
    );

    const downloadUrl = await Promise.race([uploadTask, timeoutTask]);
    return downloadUrl;
  } catch (error) {
    console.info('Storage unavailable or timed out; using high-res optimized image data URL:', error);
    if (optimizedDataUrl) {
      return optimizedDataUrl;
    }
    throw new Error("Impossible de traiter l'image sélectionnée.");
  }
}

/**
 * Deletes an image from Firebase Storage if it matches the bucket URL
 */
export async function deleteImageFile(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl || imageUrl.startsWith('data:') || !imageUrl.includes('firebasestorage.googleapis.com')) {
      return;
    }
    const fileRef = ref(storage, imageUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn('Could not delete image from Storage:', error);
  }
}
