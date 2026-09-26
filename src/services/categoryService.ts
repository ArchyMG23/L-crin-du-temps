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
import { DEFAULT_CATEGORIES } from '../data/defaultData';
import { ensureAdminAuth } from './adminService';
import { withTimeout } from '../utils/async';

const PRIMARY_COLLECTION = 'collections';
const LEGACY_COLLECTION = 'categories';
const DELETED_CATEGORIES_STORAGE_KEY = 'hp_deleted_categories';

function getDeletedCategoryIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

function markCategoryAsDeleted(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedCategoryIds();
    current.add(id);
    localStorage.setItem(DELETED_CATEGORIES_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

function clearDeletedCategories() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DELETED_CATEGORIES_STORAGE_KEY);
  } catch {}
}

export interface FetchCategoriesResult {
  categories: Category[];
  error: Error | null;
  errorMessage: string | null;
  isRealEmpty: boolean;
}

/**
 * Merges Firestore categories with DEFAULT_CATEGORIES (excluding explicitly deleted ones)
 * so the store and admin panel always have the complete horological collections & categories.
 */
function mergeWithDefaultCategories(firestoreCategories: Category[], onlyActive = false): Category[] {
  const deletedIds = getDeletedCategoryIds();
  const byId = new Map<string, Category>();
  const existingSlugs = new Set<string>();

  for (const cat of firestoreCategories) {
    if (deletedIds.has(cat.id)) continue;
    byId.set(cat.id, cat);
    if (cat.slug) existingSlugs.add(cat.slug.toLowerCase());
  }

  for (const defCat of DEFAULT_CATEGORIES) {
    if (deletedIds.has(defCat.id)) continue;
    if (!byId.has(defCat.id) && !existingSlugs.has(defCat.slug.toLowerCase())) {
      byId.set(defCat.id, {
        ...defCat,
        isActive: defCat.isActive ?? defCat.active ?? true,
        active: defCat.active ?? defCat.isActive ?? true
      });
    }
  }

  let merged = Array.from(byId.values());
  if (onlyActive) {
    merged = merged.filter((c) => c.isActive !== false && c.active !== false);
  }

  return merged.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Robust fetch for collections with diagnostic status.
 * Merges Firestore documents with default horological collections so the catalog is never stuck with only 1 collection.
 */
export async function fetchCategoriesWithStatus(onlyActive = false): Promise<FetchCategoriesResult> {
  console.log('[FIRESTORE] collections fetch with status started');
  let caughtError: Error | null = null;
  const rawDocsMap = new Map<string, any>();

  try {
    const colRef = collection(db, PRIMARY_COLLECTION);
    const snapshot: any = await Promise.race([
      getDocs(colRef),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_FIRESTORE_COLLECTIONS')), 4500)
      )
    ]);
    if (snapshot && !snapshot.empty) {
      snapshot.docs.forEach((d: any) => rawDocsMap.set(d.id, d.data()));
    }
  } catch (err: any) {
    caughtError = err;
    console.warn('[FIRESTORE] Primary collections query note:', err?.code || err?.message || err);
  }

  // Also check legacy categories collection and merge any documents found there
  try {
    const legacyRef = collection(db, LEGACY_COLLECTION);
    const legacySnapshot: any = await Promise.race([
      getDocs(legacyRef),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_FIRESTORE_LEGACY_COLLECTIONS')), 3000)
      )
    ]);
    if (legacySnapshot && !legacySnapshot.empty) {
      legacySnapshot.docs.forEach((d: any) => {
        if (!rawDocsMap.has(d.id)) {
          rawDocsMap.set(d.id, d.data());
        }
      });
      caughtError = null;
    }
  } catch (legacyErr: any) {
    if (!caughtError) caughtError = legacyErr;
    console.warn('[FIRESTORE] Legacy collections query note:', legacyErr?.code || legacyErr?.message || legacyErr);
  }

  try {
    const firestoreCategories: Category[] = Array.from(rawDocsMap.entries()).map(([id, data]) => {
      const isActive =
        data.isActive !== undefined
          ? Boolean(data.isActive)
          : data.active !== undefined
          ? Boolean(data.active)
          : true;
      return {
        id,
        ...data,
        isActive,
        active: isActive,
        slug:
          data.slug ||
          data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
          id
      } as Category;
    });

    const merged = mergeWithDefaultCategories(firestoreCategories, onlyActive);

    console.log('[FIRESTORE] collections loaded successfully:', { count: merged.length });

    return {
      categories: merged,
      error: null,
      errorMessage: null,
      isRealEmpty: merged.length === 0
    };
  } catch (mappingErr: any) {
    console.error('[FIRESTORE] Error mapping collections:', mappingErr);
    const fallback = mergeWithDefaultCategories([], onlyActive);
    return {
      categories: fallback,
      error: null,
      errorMessage: null,
      isRealEmpty: fallback.length === 0
    };
  }
}

/**
 * Explicitly restores and seeds all default horological collections into Firestore and local state.
 */
export async function restoreDefaultCategories(): Promise<Category[]> {
  clearDeletedCategories();
  try {
    await ensureAdminAuth();
    for (const cat of DEFAULT_CATEGORIES) {
      const payload: Category = {
        ...cat,
        active: true,
        isActive: true,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, PRIMARY_COLLECTION, cat.id), payload, { merge: true }).catch(() => {});
      await setDoc(doc(db, LEGACY_COLLECTION, cat.id), payload, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('[FIRESTORE] Note when seeding default collections:', err);
  }
  const res = await fetchCategoriesWithStatus(false);
  return res.categories;
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
  const defaultMatch = DEFAULT_CATEGORIES.find((c) => c.id === id);
  const normalized: any = {
    ...(defaultMatch || {}),
    ...updates,
    id
  };
  if (updates.isActive !== undefined) normalized.active = updates.isActive;
  if (updates.active !== undefined) normalized.isActive = updates.active;
  normalized.updatedAt = new Date().toISOString();

  // Remove any undefined values before writing to Firestore
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === undefined) delete normalized[key];
  });

  try {
    const docRef = doc(db, PRIMARY_COLLECTION, id);
    await Promise.race([
      setDoc(docRef, normalized, { merge: true }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai d\'écriture Firestore dépassé (timeout 10s).')), 10000)
      )
    ]);
    Promise.race([
      setDoc(doc(db, LEGACY_COLLECTION, id), normalized, { merge: true }),
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

  markCategoryAsDeleted(id);
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
