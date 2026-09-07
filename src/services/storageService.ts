import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
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
 * Uploads a product image directly to Firebase Cloud Storage.
 * Path: products/{productId}/{timestamp}_{index}_{cleanFileName}
 * Logs all steps: [PRODUCT_CREATE] Storage upload and [PRODUCT_CREATE] getDownloadURL
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  index: number
): Promise<string> {
  console.log(`[PRODUCT_CREATE] Storage upload: Starting upload for image #${index + 1} (${file.name}, ${(file.size / 1024).toFixed(1)} KB) for product ${productId}`);
  
  // 1. Ensure authenticated session for Firebase Storage Security Rules
  await ensureAdminAuth();

  // 2. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const errorMsg = `Le fichier "${file.name}" dépasse la taille maximale autorisée de 20 Mo (${(file.size / (1024 * 1024)).toFixed(1)} Mo).`;
    console.error(`[PRODUCT_CREATE] Storage upload validation error:`, errorMsg);
    throw new Error(errorMsg);
  }

  // 3. Validate MIME type or extension
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
  
  if (!hasValidExtension && !hasValidMime) {
    const errorMsg = `Format de fichier non autorisé pour "${file.name}". Formats acceptés : JPG, PNG, WebP, GIF, SVG.`;
    console.error(`[PRODUCT_CREATE] Storage upload validation error:`, errorMsg);
    throw new Error(errorMsg);
  }

  const timestamp = Date.now();
  const cleanFileName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 60);
  const storagePath = `products/${productId}/${timestamp}_${index}_${cleanFileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        productId,
        index: String(index),
        originalName: cleanFileName,
        uploadedAt: new Date().toISOString()
      }
    });

    console.log(`[PRODUCT_CREATE] Storage upload: Finished byte upload for ${file.name} to ${storagePath}`);

    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log(`[PRODUCT_CREATE] getDownloadURL: Obtained download URL: ${downloadUrl}`);
    return downloadUrl;
  } catch (error: any) {
    console.error(`[PRODUCT_CREATE] Storage upload error:`, {
      code: error?.code || 'unknown',
      message: error?.message || String(error),
      operation: 'uploadBytes / getDownloadURL',
      file: file.name,
      path: storagePath,
      details: error
    });
    throw new Error(`Échec du téléversement de "${file.name}" sur Firebase Storage : ${error?.message || error?.code || 'Erreur réseau/droits'}`);
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
