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
import { DEFAULT_CATEGORIES } from '../data/defaultData';
import { ensureAdminAuth } from './adminService';

const PRIMARY_COLLECTION = 'collections';
const LEGACY_COLLECTION = 'categories';

/**
 * Fetch all collections, optionally filtered by active state
 */
export async function getCategories(onlyActive = true): Promise<Category[]> {
  try {
    const colRef = collection(db, PRIMARY_COLLECTION);
    let snapshot = await getDocs(colRef).catch(() => null);

    // Fallback to legacy categories if primary is empty or fails
    if (!snapshot || snapshot.empty) {
      const legacyRef = collection(db, LEGACY_COLLECTION);
      snapshot = await getDocs(legacyRef).catch(() => null);
    }

    if (!snapshot || snapshot.empty) {
      return DEFAULT_CATEGORIES;
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
      return DEFAULT_CATEGORIES;
    }

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('Collections fetch notice:', error);
    return DEFAULT_CATEGORIES;
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
 * Delete a collection
 */
export async function deleteCategory(id: string): Promise<void> {
  await ensureAdminAuth();
  const hasProducts = await collectionHasProducts(id);
  if (hasProducts) {
    throw new Error('Impossible de supprimer une collection qui contient encore des garde-temps.');
  }

  const path = `${PRIMARY_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRIMARY_COLLECTION, id);
    await deleteDoc(docRef);
    await deleteDoc(doc(db, LEGACY_COLLECTION, id)).catch(() => {});
  } catch (error: any) {
    console.error(
      '[ADMIN ERROR]\ncollections.delete\ncode:',
      error?.code || 'unknown',
      '\nmessage:',
      error?.message || String(error)
    );
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
