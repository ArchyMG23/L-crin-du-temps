import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Cart } from '../types';

const CARTS_COLLECTION = 'carts';

/**
 * Fetch persistent cart for authenticated user
 */
export async function getRemoteCart(userId: string): Promise<Cart | null> {
  try {
    const docRef = doc(db, CARTS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Cart;
    }
    return null;
  } catch (error) {
    console.warn('Remote cart fetch note:', error);
    return null;
  }
}

/**
 * Save or synchronize persistent cart in Firestore
 */
export async function saveRemoteCart(userId: string, items: { productId: string; quantity: number }[]): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  try {
    const docRef = doc(db, CARTS_COLLECTION, userId);
    const payload: Cart = {
      userId,
      items: items.map(i => ({
        productId: i.productId,
        quantity: Math.max(1, Math.floor(i.quantity || 1))
      })),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload);
  } catch (error) {
    console.warn('Remote cart save note:', error);
  }
}

/**
 * Clear remote cart upon order completion
 */
export async function clearRemoteCart(userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  try {
    const docRef = doc(db, CARTS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Remote cart clear note:', error);
  }
}
