import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db, activeFirebaseConfig, handleFirestoreError, OperationType } from '../lib/firebase';
import { Category } from '../types';
import { ensureAdminAuth } from './adminService';
import { withTimeout } from '../utils/async';

const PRIMARY_COLLECTION = 'collections';
const LEGACY_COLLECTION = 'categories';

export interface FetchCategoriesResult {
  categories: Category[];
  error: Error | null;
  errorMessage: string | null;
  isRealEmpty: boolean;
}

/**
 * Robust fetch for collections with diagnostic status.
 * Distinguishes between truly empty collections (0 docs) and Firestore connection/provisioning errors.
 */
export async function fetchCategoriesWithStatus(onlyActive = false): Promise<FetchCategoriesResult> {
  console.log('[FIRESTORE] collections fetch with status started');
  let caughtError: Error | null = null;
  let snapshot: any = null;

  try {
    const colRef = collection(db, PRIMARY_COLLECTION);
    snapshot = await Promise.race([
      getDocs(colRef),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_FIRESTORE_COLLECTIONS')), 4500)
      )
    ]);
  } catch (err: any) {
    caughtError = err;
    console.warn('[FIRESTORE] Primary collections query note:', err?.code || err?.message || err);
  }

  // Fallback to legacy categories collection if primary was empty or failed
  if (!snapshot || snapshot.empty) {
    try {
      const legacyRef = collection(db, LEGACY_COLLECTION);
      const legacySnapshot: any = await Promise.race([
        getDocs(legacyRef),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_FIRESTORE_LEGACY_COLLECTIONS')), 3000)
        )
      ]);
      if (legacySnapshot && !legacySnapshot.empty) {
        snapshot = legacySnapshot;
        caughtError = null; // Legacy succeeded
      } else if (!caughtError && legacySnapshot && legacySnapshot.empty) {
        // Both returned valid empty snapshots
        snapshot = legacySnapshot;
      }
    } catch (legacyErr: any) {
      if (!caughtError) caughtError = legacyErr;
      console.warn('[FIRESTORE] Legacy collections query note:', legacyErr?.code || legacyErr?.message || legacyErr);
    }
  }

  // Handle connection or infrastructure failure
  if (caughtError && (!snapshot || snapshot.empty)) {
    const errCode = (caughtError as any)?.code || '';
    const errMsg = caughtError?.message || '';
    const isNotFound = errCode === 'not-found' || errMsg.includes('NOT_FOUND') || errMsg.includes('not-found');

    const friendlyMessage = isNotFound
      ? `Base de données Cloud Firestore (default) introuvable ou non activée sur le projet Firebase "${activeFirebaseConfig.projectId}".`
      : "Impossible de charger les collections. Vérifiez la connexion à Firebase.";

    console.warn('[FIRESTORE] Collections fetch failed with error:', { code: errCode, message: errMsg });
    return {
      categories: [],
      error: caughtError,
      errorMessage: friendlyMessage,
      isRealEmpty: false
    };
  }

  // If query succeeded and returned 0 documents: this is a legitimate empty state
  if (!snapshot || snapshot.empty) {
    console.log('[FIRESTORE] collections query succeeded: 0 documents (empty catalog)');
    return {
      categories: [],
      error: null,
      errorMessage: null,
      isRealEmpty: true
    };
  }

  try {
    let categories = snapshot.docs.map((d: any) => {
      const data = d.data();
      const isActive =
        data.isActive !== undefined
          ? Boolean(data.isActive)
          : data.active !== undefined
          ? Boolean(data.active)
          : true;
      return {
        id: d.id,
        ...data,
        isActive,
        active: isActive,
        slug:
          data.slug ||
          data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
          d.id
      } as Category;
    });

    if (onlyActive) {
      categories = categories.filter((c: Category) => c.isActive && c.active);
    }

    const sorted = categories.sort((a: Category, b: Category) => (a.name || '').localeCompare(b.name || ''));
    console.log('[FIRESTORE] collections loaded successfully:', { count: sorted.length });

    return {
      categories: sorted,
      error: null,
      errorMessage: null,
      isRealEmpty: sorted.length === 0
    };
  } catch (mappingErr: any) {
    console.error('[FIRESTORE] Error mapping collections:', mappingErr);
    return {
      categories: [],
      error: mappingErr,
      errorMessage: "Impossible de charger les collections. Données corrompues.",
      isRealEmpty: false
    };
  }
}

/**
 * Fetch all collections, optionally filtered by active state.
 * Strictly returns empty array [] when no collections exist in Firestore.
 */
export async function getCategories(onlyActive = true): Promise<Category[]> {
  const result = await fetchCategoriesWithStatus(onlyActive);
  return result.categories;
}

/**
 * Get collection by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, PRIMARY_COLLECTION, id);
    let snap = await getDoc(docRef);
    if (!snap.exists()) {
      const legacyRef = doc(db, LEGACY_COLLECTION, id);
      snap = await getDoc(legacyRef);
    }
    if (snap.exists()) {
      const data = snap.data();
      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.active !== undefined ? Boolean(data.active) : true);
      return {
        id: snap.id,
        ...data,
        isActive,
        active: isActive,
      } as Category;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching collection by ID:', error);
    return null;
  }
}

/**
 * Check if a collection has watches attached before deletion
 */
export async function collectionHasProducts(collectionId: string): Promise<boolean> {
  try {
    const productsRef = collection(db, 'products');
    const q1 = query(productsRef, where('collectionId', '==', collectionId));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) return true;

    const q2 = query(productsRef, where('categoryId', '==', collectionId));
    const snap2 = await getDocs(q2);
    return !snap2.empty;
  } catch {
    return false;
  }
}

/**
 * Create a new collection
 */
export async function createCategory(catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await ensureAdminAuth();
  const docRef = doc(collection(db, PRIMARY_COLLECTION));
  const nowIso = new Date().toISOString();
  const isActive = catData.isActive !== undefined ? Boolean(catData.isActive) : (catData.active !== undefined ? Boolean(catData.active) : true);

  const newCat: Category = {
    ...catData,
    id: docRef.id,
    isActive,
    active: isActive,
    slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    await Promise.race([
      setDoc(docRef, newCat),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai d\'écriture Firestore dépassé (timeout 10s).')), 10000)
      )
    ]);
    // Mirror to legacy collection for compatibility with safety
    Promise.race([
      setDoc(doc(db, LEGACY_COLLECTION, docRef.id), newCat),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]).catch(() => {});

    console.log(`[COLLECTION CREATE] FIRESTORE WRITE SUCCESS for ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error(
      '[COLLECTION CREATE] ERROR\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error)
    );
    handleFirestoreError(error, OperationType.CREATE, `${PRIMARY_COLLECTION}/${docRef.id}`);
  }
}

/**
 * Update an existing collection
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  await ensureAdminAuth();
  const path = `${PRIMARY_COLLECTION}/${id}`;
  const normalized: any = { ...updates };
  if (updates.isActive !== undefined) normalized.active = updates.isActive;
  if (updates.active !== undefined) normalized.isActive = updates.active;
  normalized.updatedAt = new Date().toISOString();

  try {
    const docRef = doc(db, PRIMARY_COLLECTION, id);
    await Promise.race([
      updateDoc(docRef, normalized),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai d\'écriture Firestore dépassé (timeout 10s).')), 10000)
      )
    ]);
    Promise.race([
      updateDoc(doc(db, LEGACY_COLLECTION, id), normalized),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]).catch(() => {});
  } catch (error: any) {
    console.error(
      '[ADMIN ERROR]\ncollections.update\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error)
    );
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a collection from Firestore
 */
export async function deleteCategory(id: string): Promise<void> {
  await ensureAdminAuth();
  const hasProducts = await collectionHasProducts(id);
  if (hasProducts) {
    const errorMsg = 'Impossible de supprimer cette collection car des montres y sont encore associées. Réassignez ou supprimez d\'abord ces modèles.';
    console.warn('[SUPPRESSION COLLECTION]', {
      id,
      collection: PRIMARY_COLLECTION,
      statut: 'REFUSÉ',
      erreur: errorMsg
    });
    throw new Error(errorMsg);
  }

  const path = `${PRIMARY_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRIMARY_COLLECTION, id);
    await deleteDoc(docRef);
    await deleteDoc(doc(db, LEGACY_COLLECTION, id)).catch(() => {});
    console.log('[SUPPRESSION COLLECTION]', {
      id,
      collection: PRIMARY_COLLECTION,
      statut: 'SUCCÈS (supprimée définitivement de Firestore)'
    });
  } catch (error: any) {
    console.error('[SUPPRESSION COLLECTION]', {
      id,
      collection: PRIMARY_COLLECTION,
      statut: 'ÉCHEC',
      erreur: error?.message || String(error)
    });
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
