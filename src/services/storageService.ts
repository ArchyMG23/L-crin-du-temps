import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Uploads an image file to Firebase Storage under the products or branding directory
 * Performs strict client-side validation of MIME type, extension, and file size.
 * Returns the public download URL
 */
export async function uploadImageFile(file: File, folder: 'products' | 'branding' | 'categories' = 'products'): Promise<string> {
  // 1. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Le fichier dépasse la taille maximale autorisée de 10 Mo.');
  }

  // 2. Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    throw new Error('Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, GIF, SVG.');
  }

  // 3. Validate file extension
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  if (!hasValidExtension) {
    throw new Error('Extension de fichier invalide.');
  }

  try {
    const timestamp = Date.now();
    // Sanitize filename to prevent directory traversal or illegal characters
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 100);
    const storagePath = `${folder}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: cleanFileName
      }
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload notice (fallback to Data URL):', error);
    // Convert to base64 DataURL fallback if storage bucket offline
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
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
