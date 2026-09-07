import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { User, signInAnonymously } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { AdminUser } from '../types';

const ADMINS_COLLECTION = 'admins';

const SUPER_ADMIN_EMAILS = [
  'gabrielyombi311@gmail.com',
  'admin@horlogerie-prestige.com',
  'contact@horlogerie-prestige.com'
];

/**
 * Ensures an admin authentication session is established before running administrative Firestore operations.
 */
export async function ensureAdminAuth(): Promise<void> {
  const isCmsSession =
    sessionStorage.getItem('hp_cms_auth') === 'true' ||
    localStorage.getItem('hp_cms_auth') === 'true';

  if (!isCmsSession) return;

  if (!auth.currentUser) {
    try {
      const anonRes = await signInAnonymously(auth);
      if (anonRes?.user) {
        await registerAdmin(
          anonRes.user.uid,
          'admin@horlogerie-prestige.com',
          'owner',
          'Gérant Boutique'
        ).catch(() => {});
      }
    } catch (authErr) {
      console.warn('ensureAdminAuth auto-sign-in note:', authErr);
    }
  } else if (auth.currentUser.isAnonymous) {
    // Ensure the anonymous admin document exists in /admins
    await registerAdmin(
      auth.currentUser.uid,
      'admin@horlogerie-prestige.com',
      'owner',
      'Gérant Boutique'
    ).catch(() => {});
  }
}

/**
 * Checks if a given user has administrator permissions.
 * Verifies against Firestore /admins/{uid} doc or super admin email list.
 */
export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  // 1. Check custom claims (e.g. { admin: true }) set via Firebase Admin SDK
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims && (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin' || tokenResult.claims.role === 'owner')) {
      return true;
    }
  } catch (claimErr) {
    console.warn('Error reading auth custom claims:', claimErr);
  }

  // 2. Check known super-admin email list
  if (user.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true;
  }

  // 3. Check Firestore /admins/{uid} document
  try {
    const adminDocRef = doc(db, ADMINS_COLLECTION, user.uid);
    const snap = await getDoc(adminDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return Boolean(data && (data.role === 'owner' || data.role === 'admin' || data.role === 'manager'));
    }
    return false;
  } catch (error) {
    console.warn('Error verifying admin document:', error);
    // If checking by email succeeded above, it already returned true
    return false;
  }
}

/**
 * Retrieves the admin profile for a given user ID
 */
export async function getAdminProfile(uid: string): Promise<AdminUser | null> {
  const path = `${ADMINS_COLLECTION}/${uid}`;
  try {
    const adminDocRef = doc(db, ADMINS_COLLECTION, uid);
    const snap = await getDoc(adminDocRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as AdminUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Registers or updates an administrator profile in Firestore
 */
export async function registerAdmin(
  uid: string,
  email: string,
  role: 'owner' | 'admin' | 'manager' = 'admin',
  displayName?: string
): Promise<void> {
  const path = `${ADMINS_COLLECTION}/${uid}`;
  try {
    const adminDocRef = doc(db, ADMINS_COLLECTION, uid);
    const adminData: AdminUser = {
      id: uid,
      email,
      role,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(adminDocRef, adminData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Lists all registered administrators
 */
export async function listAdmins(): Promise<AdminUser[]> {
  try {
    const colRef = collection(db, ADMINS_COLLECTION);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ADMINS_COLLECTION);
  }
}

/**
 * Deletes an administrator entry
 */
export async function deleteAdmin(uid: string): Promise<void> {
  const path = `${ADMINS_COLLECTION}/${uid}`;
  try {
    const adminDocRef = doc(db, ADMINS_COLLECTION, uid);
    await deleteDoc(adminDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
