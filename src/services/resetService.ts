import {
  collection,
  getDocs,
  doc,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface ResetOptions {
  deleteOrders: boolean;
  deleteProducts: boolean;
  deleteCategories: boolean;
  deleteCustomers: boolean;
}

export interface ResetResult {
  deletedOrders: number;
  deletedProducts: number;
  deletedCategories: number;
  deletedCustomers: number;
}

/**
 * Helper to delete a list of document references in chunks of max 400
 * to strictly respect Firestore batch limits (max 500 operations per batch).
 */
async function batchDeleteDocs(docRefs: DocumentReference[], collectionName: string): Promise<number> {
  if (docRefs.length === 0) return 0;
  
  const BATCH_SIZE = 400;
  let count = 0;

  for (let i = 0; i < docRefs.length; i += BATCH_SIZE) {
    const chunk = docRefs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const ref of chunk) {
      batch.delete(ref);
    }
    try {
      await batch.commit();
      count += chunk.length;
    } catch (batchErr: any) {
      console.error(`[Firestore Reset Error] Échec de la suppression dans "${collectionName}":`, {
        collection: collectionName,
        code: batchErr?.code,
        message: batchErr?.message,
        error: batchErr
      });
      throw new Error(`Erreur lors de la suppression de la collection "${collectionName}": ${batchErr?.message || 'Permission refusée ou erreur réseau'}`);
    }
  }

  return count;
}

/**
 * Highly protected Admin-only Reset engine.
 * Safely purges demo/test data directly from Firestore database.
 * Preserves administrator accounts, credentials, store settings, and security rules.
 */
export async function resetStoreData(options: ResetOptions = {
  deleteOrders: true,
  deleteProducts: true,
  deleteCategories: true,
  deleteCustomers: true
}): Promise<ResetResult> {
  let deletedOrders = 0;
  let deletedProducts = 0;
  let deletedCategories = 0;
  let deletedCustomers = 0;

  // 1. Delete Orders
  if (options.deleteOrders) {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const refs = ordersSnap.docs.map((d) => doc(db, 'orders', d.id));
      deletedOrders = await batchDeleteDocs(refs, 'orders');
    } catch (e: any) {
      console.error('[Reset Error] Collection orders:', e);
      throw e;
    }
  }

  // 2. Delete Products
  if (options.deleteProducts) {
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      const refs = productsSnap.docs.map((d) => doc(db, 'products', d.id));
      deletedProducts = await batchDeleteDocs(refs, 'products');
    } catch (e: any) {
      console.error('[Reset Error] Collection products:', e);
      throw e;
    }
  }

  // 3. Delete Categories
  if (options.deleteCategories) {
    try {
      const catsSnap = await getDocs(collection(db, 'categories'));
      const refs = catsSnap.docs.map((d) => doc(db, 'categories', d.id));
      deletedCategories = await batchDeleteDocs(refs, 'categories');
    } catch (e: any) {
      console.error('[Reset Error] Collection categories:', e);
      throw e;
    }
  }

  // 4. Delete Customers (NEVER delete admin or owner profiles)
  if (options.deleteCustomers) {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const customerRefs: DocumentReference[] = [];
      usersSnap.docs.forEach((d) => {
        const data = d.data();
        // Strict guard: only purge customers, never admins or owners
        if (data.role === 'customer' || !data.role) {
          // Extra guard: do not delete the currently logged in admin user doc
          if (auth.currentUser && d.id === auth.currentUser.uid) {
            return;
          }
          customerRefs.push(doc(db, 'users', d.id));
        }
      });
      deletedCustomers = await batchDeleteDocs(customerRefs, 'users');
    } catch (e: any) {
      console.error('[Reset Error] Collection users:', e);
      throw e;
    }
  }

  return {
    deletedOrders,
    deletedProducts,
    deletedCategories,
    deletedCustomers
  };
}
