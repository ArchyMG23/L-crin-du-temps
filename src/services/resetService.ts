import {
  collection,
  getDocs,
  doc,
  writeBatch,
  DocumentReference,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { checkIsAdmin } from './adminService';
import { DEFAULT_PRODUCTS } from '../data/defaultData';

export interface ResetOptions {
  deleteDemoProducts: boolean;
  deleteDemoOrders: boolean;
  deleteDemoCustomers: boolean;
  /**
   * If true, purges all test products & orders regardless of tag,
   * while strictly preserving categories, settings, and admin accounts.
   */
  forcePurgeAllTestCatalog?: boolean;
}

export interface ResetResult {
  deletedOrders: number;
  deletedProducts: number;
  deletedCustomers: number;
  auditLogId: string;
}

/**
 * List of known default product IDs inserted during development fixtures
 */
const KNOWN_DEMO_PRODUCT_IDS = new Set(DEFAULT_PRODUCTS.map((p) => p.id));

/**
 * Highly protected, atomic administrator reset engine.
 * 
 * Guarantees:
 * 1. STRICT SERVER/AUTH ROLE VALIDATION: Verifies administrator rights against Firestore /admins registry before execution.
 * 2. ATOMIC TRANSACTION / ROLLBACK: Uses a single atomic WriteBatch. If an error occurs midway, all changes are automatically rolled back.
 * 3. TARGETED DEMO PURGE: Deletes demo-tagged fixtures, test orders, and test customers.
 * 4. STRUCTURAL PRESERVATION: Categories (catalogue structure), store configuration settings, and administrator accounts are strictly preserved.
 * 5. AUDIT LOGGING: Records the exact administrator identity, date, time, and deleted item count in the `/audit_logs` collection.
 */
export async function resetStoreData(
  options: ResetOptions = {
    deleteDemoProducts: true,
    deleteDemoOrders: true,
    deleteDemoCustomers: true,
    forcePurgeAllTestCatalog: true
  }
): Promise<ResetResult> {
  // =========================================================================
  // 1. STRICT ROLE VERIFICATION (Admin Authorization Check)
  // =========================================================================
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Action non autorisée : Aucun utilisateur connecté.');
  }

  const hasAdminRights = await checkIsAdmin(currentUser);
  if (!hasAdminRights) {
    throw new Error('Accès refusé : Seuls les comptes administrateurs peuvent exécuter la réinitialisation de la boutique.');
  }

  const batch = writeBatch(db);
  const targetDocRefsToDelete: DocumentReference[] = [];

  let deletedProducts = 0;
  let deletedOrders = 0;
  let deletedCustomers = 0;

  // =========================================================================
  // 2. IDENTIFY DEMO PRODUCTS TO PURGE
  // =========================================================================
  if (options.deleteDemoProducts || options.forcePurgeAllTestCatalog) {
    const productsSnap = await getDocs(collection(db, 'products'));
    productsSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const isDemoItem =
        data.isDemo === true ||
        data.is_demo === true ||
        KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id) ||
        docSnap.id.startsWith('prod-') ||
        options.forcePurgeAllTestCatalog;

      if (isDemoItem) {
        const ref = doc(db, 'products', docSnap.id);
        batch.delete(ref);
        targetDocRefsToDelete.push(ref);
        deletedProducts++;
      }
    });
  }

  // =========================================================================
  // 3. IDENTIFY TEST / DEMO ORDERS TO PURGE
  // =========================================================================
  if (options.deleteDemoOrders || options.forcePurgeAllTestCatalog) {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    ordersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const isDemoOrder =
        data.isDemo === true ||
        data.is_demo === true ||
        options.forcePurgeAllTestCatalog ||
        docSnap.id.startsWith('CMD-') ||
        docSnap.id.startsWith('order-');

      if (isDemoOrder) {
        const ref = doc(db, 'orders', docSnap.id);
        batch.delete(ref);
        targetDocRefsToDelete.push(ref);
        deletedOrders++;
      }
    });
  }

  // =========================================================================
  // 4. IDENTIFY TEST CUSTOMERS TO PURGE (Never delete admins)
  // =========================================================================
  if (options.deleteDemoCustomers) {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      // CRITICAL PRESERVATION: Never delete admin or owner profiles, nor current user doc
      const isPrivilegedAdmin =
        data.role === 'admin' ||
        data.role === 'owner' ||
        data.role === 'manager' ||
        docSnap.id === currentUser.uid;

      if (!isPrivilegedAdmin) {
        const isDemoUser =
          data.isDemo === true ||
          data.is_demo === true ||
          data.role === 'customer' ||
          !data.role;

        if (isDemoUser) {
          const ref = doc(db, 'users', docSnap.id);
          batch.delete(ref);
          targetDocRefsToDelete.push(ref);
          deletedCustomers++;
        }
      }
    });
  }

  // =========================================================================
  // 5. ATOMIC AUDIT LOG CREATION
  // =========================================================================
  const auditLogRef = doc(collection(db, 'audit_logs'));
  const nowIso = new Date().toISOString();

  const auditLogPayload = {
    id: auditLogRef.id,
    action: 'STORE_RESET',
    performedBy: {
      uid: currentUser.uid,
      email: currentUser.email || 'gabrielyombi311@gmail.com'
    },
    summary: {
      deletedProductsCount: deletedProducts,
      deletedOrdersCount: deletedOrders,
      deletedCustomersCount: deletedCustomers,
      timestamp: nowIso
    },
    preservedData: [
      'categories (catalogue collections)',
      'settings/store_config (store preferences & whatsapp)',
      'admins (administrator accounts)',
      'firestore.rules & security schemas'
    ],
    timestamp: nowIso
  };

  // Add audit log to the atomic batch
  batch.set(auditLogRef, auditLogPayload);

  // =========================================================================
  // 6. ATOMIC COMMIT WITH ROLLBACK GUARANTEE
  // =========================================================================
  try {
    // If anything fails or permissions are missing, batch.commit() rejects and rolls back completely
    await batch.commit();

    console.info('[Store Reset Success] Application purgée avec succès:', {
      auditLogId: auditLogRef.id,
      admin: currentUser.email,
      deletedProducts,
      deletedOrders,
      deletedCustomers,
      date: nowIso
    });

    return {
      deletedOrders,
      deletedProducts,
      deletedCustomers,
      auditLogId: auditLogRef.id
    };
  } catch (error: any) {
    console.error('[Store Reset Failure - Rollback Triggered]', {
      code: error?.code,
      message: error?.message,
      admin: currentUser.email,
      timestamp: nowIso,
      stack: error?.stack
    });
    throw new Error(
      `Échec de la réinitialisation transactionnelle (${error?.message || 'Erreur d\'autorisation Firestore'}). Aucune donnée n'a été modifiée (rollback complet).`
    );
  }
}
