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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Category } from '../types';
import { ensureAdminAuth } from './adminService';
import { withTimeout } from '../utils/async';

const PRIMARY_COLLECTION = 'collections';
const LEGACY_COLLECTION = 'categories';

/**
 * Fetch all collections, optionally filtered by active state.
 * Strictly returns empty array [] when no collections exist in Firestore.
 */
export async function getCategories(onlyActive = true): Promise<Category[]> {
  console.log('[FIRESTORE] collections started');
  try {
    const colRef = collection(db, PRIMARY_COLLECTION);
    let snapshot = await withTimeout(getDocs(colRef), 3000, null, 'firestore-collections-primary');

    // Fallback to legacy categories if primary is empty or fails
    if (!snapshot || snapshot.empty) {
      const legacyRef = collection(db, LEGACY_COLLECTION);
      snapshot = await withTimeout(getDocs(legacyRef), 2000, null, 'firestore-collections-legacy');
    }

    if (!snapshot || snapshot.empty) {
      console.log('[FIRESTORE] collections finished', { count: 0 });
      return [];
    }

    let categories = snapshot.docs.map(d => {
      const data = d.data();
      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.active !== undefined ? Boolean(data.active) : true);
      return {
        id: d.id,
        ...data,
        isActive,
        active: isActive,
        slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || d.id,
      } as Category;
    });

    if (onlyActive) {
      categories = categories.filter(c => c.isActive && c.active);
    }

    if (categories.length === 0) {
      console.log('[FIRESTORE] collections finished', { count: 0 });
      return [];
    }

    const sorted = categories.sort((a, b) => a.name.localeCompare(b.name));
    console.log('[FIRESTORE] collections finished', { count: sorted.length });
    return sorted;
  } catch (error) {
    console.warn('Collections fetch notice (Firestore vide ou non initialisé):', error);
    console.log('[FIRESTORE] collections finished', { count: 0, error: true });
    return [];
  }
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
    await setDoc(docRef, newCat);
    // Mirror to legacy collection for compatibility
    await setDoc(doc(db, LEGACY_COLLECTION, docRef.id), newCat).catch(() => {});
    return docRef.id;
  } catch (error: any) {
    console.error(
      '[ADMIN ERROR]\ncollections.create\ncode:',
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
    await updateDoc(docRef, normalized);
    await updateDoc(doc(db, LEGACY_COLLECTION, id), normalized).catch(() => {});
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
