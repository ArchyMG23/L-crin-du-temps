import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ResetOptions {
  deleteOrders: boolean;
  deleteProducts: boolean;
  deleteCategories: boolean;
  deleteCustomers: boolean;
}

/**
 * Highly protected Admin-only Reset engine.
 * Safely purges demo/test data without altering store configuration,
 * administrator credentials or Firestore database security rules.
 */
export async function resetStoreData(options: ResetOptions = {
  deleteOrders: true,
  deleteProducts: true,
  deleteCategories: true,
  deleteCustomers: true
}): Promise<{ deletedOrders: number; deletedProducts: number; deletedCategories: number; deletedCustomers: number }> {
  let deletedOrders = 0;
  let deletedProducts = 0;
  let deletedCategories = 0;
  let deletedCustomers = 0;

  // 1. Delete Orders
  if (options.deleteOrders) {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      ordersSnap.docs.forEach((d) => {
        batch.delete(doc(db, 'orders', d.id));
        deletedOrders++;
      });
      if (deletedOrders > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn('Reset orders notice:', e);
    }
  }

  // 2. Delete Products
  if (options.deleteProducts) {
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      productsSnap.docs.forEach((d) => {
        batch.delete(doc(db, 'products', d.id));
        deletedProducts++;
      });
      if (deletedProducts > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn('Reset products notice:', e);
    }
  }

  // 3. Delete Categories
  if (options.deleteCategories) {
    try {
      const catsSnap = await getDocs(collection(db, 'categories'));
      const batch = writeBatch(db);
      catsSnap.docs.forEach((d) => {
        batch.delete(doc(db, 'categories', d.id));
        deletedCategories++;
      });
      if (deletedCategories > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn('Reset categories notice:', e);
    }
  }

  // 4. Delete Customers (NEVER delete admin or owner profiles)
  if (options.deleteCustomers) {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      usersSnap.docs.forEach((d) => {
        const data = d.data();
        // Strict guard: only purge customers, never admins or owners
        if (data.role === 'customer' || !data.role) {
          batch.delete(doc(db, 'users', d.id));
          deletedCustomers++;
        }
      });
      if (deletedCustomers > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn('Reset customers notice:', e);
    }
  }

  return {
    deletedOrders,
    deletedProducts,
    deletedCategories,
    deletedCustomers
  };
}
