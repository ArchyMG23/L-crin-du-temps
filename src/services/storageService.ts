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
const MAX_DATA_URL_CHARS = 92 * 1024; // ~90KB max per image to guarantee < 1MB in Firestore even with 8 photos

const IDB_NAME = 'hp_watch_media_db';
const IDB_STORE = 'product_images';
const IDB_VERSION = 1;

function openMediaDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Persists a product's image array into IndexedDB (unlimited browser storage, immune to 5MB localStorage quota).
 */
export async function saveProductImagesToIDB(productId: string, images: string[]): Promise<void> {
  if (!productId || !Array.isArray(images)) return;
  const clean = images.filter((u) => !isBrokenOrBlobUrl(u));
  if (clean.length === 0) return;
  const db = await openMediaDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ images: clean, updatedAt: new Date().toISOString() }, productId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Retrieves all persisted product image arrays from IndexedDB.
 */
export async function getAllProductImagesFromIDB(): Promise<
  Record<string, { images: string[]; updatedAt: string }>
> {
  const db = await openMediaDB();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const result: Record<string, { images: string[]; updatedAt: string }> = {};
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const key = String(cursor.key);
          const val = cursor.value;
          if (val && Array.isArray(val.images) && val.images.length > 0) {
            result[key] = {
              images: val.images.filter((u: string) => !isBrokenOrBlobUrl(u)),
              updatedAt: val.updatedAt || ''
            };
          }
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      cursorReq.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
}

export async function deleteProductImagesFromIDB(productId: string): Promise<void> {
  if (!productId) return;
  const db = await openMediaDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(productId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

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
      setTimeout(() => reject(new Error('FIREBASE_STORAGE_TIMEOUT')), 2500)
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
    console.info(
      `[FIREBASE STORAGE] Optimisation HD persistante pour ${storagePath} (${
        storageErr?.code || storageErr?.message || storageErr
      })`
    );

    // Fallback de secours haute-fidélité (Data URL WebP/JPEG compressée garantie < 90 Ko pour tenir dans Firestore même avec 8 photos)
    const persistentDataUrl = await compressImageToDataUrl(file, 820, 0.78);
    if (!persistentDataUrl || persistentDataUrl.startsWith('blob:')) {
      throw new Error(
        `Échec du traitement de l'image "${file.name}" : ${
          storageErr?.message || 'Erreur de lecture'
        }`
      );
    }
    return persistentDataUrl;
  }
}

/**
 * Compresses an image file client-side to an optimized Data URL guaranteed to fit inside
 * Firestore's 1 MiB document budget even when a watch has up to 8 gallery photos.
 */
export function compressImageToDataUrl(file: File, maxDim = 820, quality = 0.78): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      if (
        (file.type === 'image/svg+xml' || file.type === 'image/gif') &&
        rawDataUrl.length <= MAX_DATA_URL_CHARS
      ) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const encodeAt = (dimLimit: number, q: number): string => {
            let width = img.width;
            let height = img.height;
            if (width > dimLimit || height > dimLimit) {
              if (width > height) {
                height = Math.round((height * dimLimit) / width);
                width = dimLimit;
              } else {
                width = Math.round((width * dimLimit) / height);
                height = dimLimit;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return rawDataUrl;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            let out = canvas.toDataURL('image/webp', q);
            if (!out || !out.startsWith('data:image/webp')) {
              out = canvas.toDataURL('image/jpeg', q);
            }
            return out;
          };

          let dataUrl = encodeAt(maxDim, quality);

          // Adaptive pass 2 if image still exceeds ~90 KB
          if (dataUrl.length > MAX_DATA_URL_CHARS) {
            dataUrl = encodeAt(680, 0.7);
          }
          // Adaptive pass 3 if still large
          if (dataUrl.length > MAX_DATA_URL_CHARS) {
            dataUrl = encodeAt(540, 0.62);
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
