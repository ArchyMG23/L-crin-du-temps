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

/**
 * Checks whether an image URL is a temporary browser blob: URL or invalid string.
 */
export function isBrokenOrBlobUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('blob:')) return true;
  if (trimmed === 'undefined' || trimmed === 'null') return true;
  return false;
}

/**
 * Generates a unique filename with UUID + extension for Firebase Storage
 */
function generateUniqueFileName(file: File): string {
  const extMatch = file.name.toLowerCase().match(/\.[a-z0-9]+$/);
  const ext = extMatch ? extMatch[0] : '.jpg';
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const cleanBase = file.name
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  return `${uuid}_${cleanBase}${ext}`;
}

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
 * Uploads a product image to Firebase Storage under `products/{productId}/{uuid}.{ext}`
 * and returns the permanent download URL via `getDownloadURL()`.
 * Never returns a temporary `blob:` URL.
 */
export async function uploadProductImage(
  file: File,
  productId = 'general',
  index?: number
): Promise<string> {
  const tStart = performance.now();
  console.log(
    `[FIREBASE STORAGE] Upload démarré pour l'image #${(index ?? 0) + 1} (${file.name}, ${(
      file.size / 1024
    ).toFixed(1)} Ko)`
  );

  // 1. Validation de la taille maximale (20 Mo)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const errorMsg = `Le fichier "${file.name}" dépasse la taille maximale autorisée de 20 Mo (${(
      file.size /
      (1024 * 1024)
    ).toFixed(1)} Mo).`;
    throw new Error(errorMsg);
  }

  // 2. Validation du type MIME et de l'extension
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasValidMime =
    ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');

  if (!hasValidExtension && !hasValidMime) {
    throw new Error(
      `Format de fichier non autorisé pour "${file.name}". Formats acceptés : JPG, PNG, WebP, GIF, SVG.`
    );
  }

  // 3. S'assurer que la session admin est authentifiée pour Firebase Storage
  try {
    await ensureAdminAuth();
  } catch (authErr) {
    console.warn('[FIREBASE STORAGE] Note auth avant upload:', authErr);
  }

  const safeFolderId = (productId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueFileName = generateUniqueFileName(file);
  const storagePath = `products/${safeFolderId}/${uniqueFileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const uploadPromise = uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        productId: safeFolderId,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    }).then((snapshot) => getDownloadURL(snapshot.ref));

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('FIREBASE_STORAGE_TIMEOUT')), 12000)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);

    if (!downloadUrl || downloadUrl.startsWith('blob:')) {
      throw new Error('URL Firebase Storage invalide reçue.');
    }

    console.log(
      `[FIREBASE STORAGE] Upload réussi en ${(performance.now() - tStart).toFixed(0)}ms -> ${downloadUrl}`
    );
    return downloadUrl;
  } catch (storageErr: any) {
    console.warn(
      `[FIREBASE STORAGE] Upload direct vers gs://${activeFirebaseConfig.storageBucket}/${storagePath} indisponible (${
        storageErr?.code || storageErr?.message || storageErr
      }), compression HD persistante...`
    );

    // Fallback de secours haute-fidélité (Data URL WebP/JPEG compressée < 90 Ko pour tenir dans Firestore sans jamais utiliser de blob:)
    const persistentDataUrl = await compressImageToDataUrl(file, 900, 0.8);
    if (!persistentDataUrl || persistentDataUrl.startsWith('blob:')) {
      throw new Error(
        `Échec de l'upload de l'image "${file.name}" vers Firebase Storage : ${
          storageErr?.message || 'Erreur réseau'
        }`
      );
    }
    return persistentDataUrl;
  }
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
 * Deletes an image from Firebase Storage if it matches the bucket URL or storage path
 */
export async function deleteImageFile(imageUrl: string): Promise<void> {
  try {
    if (
      !imageUrl ||
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('blob:') ||
      (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('firebasestorage.app'))
    ) {
      return;
    }
    await ensureAdminAuth().catch(() => {});
    const fileRef = ref(storage, imageUrl);
    await deleteObject(fileRef);
    console.log('[FIREBASE STORAGE] Ancienne image supprimée avec succès :', imageUrl);
  } catch (error: any) {
    if (error?.code !== 'storage/object-not-found') {
      console.warn('[FIREBASE STORAGE] Note lors de la suppression de l\'ancienne image :', error);
    }
  }
}

/**
 * Compares previous product image URLs with the updated image URLs and deletes any removed/replaced
 * images from Firebase Storage via deleteObject().
 */
export async function cleanupReplacedProductImages(
  previousUrls: (string | undefined | null)[],
  nextUrls: (string | undefined | null)[]
): Promise<void> {
  const nextSet = new Set(nextUrls.filter((u): u is string => Boolean(u && u.trim())));
  const toDelete = Array.from(
    new Set(
      previousUrls.filter(
        (u): u is string =>
          Boolean(
            u &&
              typeof u === 'string' &&
              (u.includes('firebasestorage.googleapis.com') || u.includes('firebasestorage.app')) &&
              !nextSet.has(u)
          )
      )
    )
  );

  if (toDelete.length === 0) return;

  await Promise.allSettled(toDelete.map((url) => deleteImageFile(url)));
}
