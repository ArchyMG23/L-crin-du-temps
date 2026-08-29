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

const CATEGORIES_COLLECTION = 'categories';

/**
 * Fetch all categories, optionally filtered by active state
 */
export async function getCategories(onlyActive = true): Promise<Category[]> {
  try {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    const q = onlyActive ? query(colRef, where('active', '==', true)) : colRef;
    
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (permError) {
      if (onlyActive) {
        throw permError;
      }
      const activeQ = query(colRef, where('active', '==', true));
      snapshot = await getDocs(activeQ);
    }

    if (snapshot.empty) {
      return onlyActive ? DEFAULT_CATEGORIES.filter(c => c.active) : DEFAULT_CATEGORIES;
    }

    let categories = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    if (onlyActive) {
      categories = categories.filter(c => c.active);
    }
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('Categories fetch warning, using default categories:', error);
    return onlyActive ? DEFAULT_CATEGORIES.filter(c => c.active) : DEFAULT_CATEGORIES;
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Category;
    }
    const local = DEFAULT_CATEGORIES.find(c => c.id === id);
    return local || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Create a new category
 */
export async function createCategory(catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(collection(db, CATEGORIES_COLLECTION));
  const newCat: Category = {
    ...catData,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(docRef, newCat);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${CATEGORIES_COLLECTION}/${docRef.id}`);
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
