import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch all products, with optional filtering for public active ones
 */
export async function getProducts(onlyActive = true): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const q = onlyActive ? query(colRef, where('active', '==', true)) : colRef;
    
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (permError) {
      if (onlyActive) {
        throw permError;
      }
      // If full access query fails because user is not yet logged in as admin, fallback to active
      const activeQ = query(colRef, where('active', '==', true));
      snapshot = await getDocs(activeQ);
    }
    
    if (snapshot.empty) {
      return [];
    }

    let products = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
    if (onlyActive) {
      products = products.filter(p => p.active);
    }
    
    // Sort by featured first, then name
    return products.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.warn('Firestore products fetch error:', error);
    return [];
  }
}

/**
 * Fetch a single product by its URL-friendly slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(colRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      return { id: docData.id, ...docData.data() } as Product;
    }

    return null;
  } catch (error) {
    console.warn('Error fetching product by slug:', error);
    return null;
  }
}

/**
 * Fetch a single product by its unique document ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching product by id:', error);
    return null;
  }
}

/**
 * Create a new product in Firestore
 */
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(collection(db, PRODUCTS_COLLECTION));
  const newProduct: Product = {
    ...productData,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, newProduct);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${docRef.id}`);
  }
}

/**
 * Update existing product attributes
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProduct(id: string): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Update stock level directly (used by admin stock controller)
 */
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      stock: Math.max(0, newStock),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Atomic stock deduction within a Firestore transaction.
 * Guarantees that multiple concurrent buyers cannot cause negative stock.
 */
export async function decrementStock(productId: string, quantityToDeduct: number): Promise<boolean> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(productRef);
      if (!sfDoc.exists()) {
        throw new Error(`Produit #${productId} introuvable`);
      }
      const currentStock = sfDoc.data().stock ?? 0;
      const currentOrderCount = sfDoc.data().orderCount ?? 0;
      const newStock = Math.max(0, currentStock - quantityToDeduct);
      transaction.update(productRef, {
        stock: newStock,
        orderCount: currentOrderCount + quantityToDeduct,
        updatedAt: new Date().toISOString()
      });
    });
    return true;
  } catch (e) {
    console.error("Stock decrement transaction failed:", e);
    return false;
  }
}

/**
 * Decrement orderCount when an order is cancelled
 */
export async function decrementProductOrderCount(productId: string, quantityToRestore: number): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(productRef);
      if (sfDoc.exists()) {
        const currentOrderCount = sfDoc.data().orderCount ?? 0;
        const newCount = Math.max(0, currentOrderCount - quantityToRestore);
        transaction.update(productRef, {
          orderCount: newCount,
          updatedAt: new Date().toISOString()
        });
      }
    });
  } catch (e) {
    console.warn("Order count decrement notice:", e);
  }
}

