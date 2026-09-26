import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { User, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { AdminUser } from '../types';
import { withTimeout } from '../utils/async';

const ADMINS_COLLECTION = 'admins';

const SUPER_ADMIN_EMAILS = [
  'gabrielyombi311@gmail.com',
  'admin@horlogerie-prestige.com',
  'contact@horlogerie-prestige.com'
];

// In-memory cache for verified admin auth session to eliminate redundant Firestore writes
let cachedAdminUid: string | null = null;

/**
 * Ensures an admin authentication session is established before running administrative Firestore operations.
 * Caches the verification in-memory so subsequent calls complete in 0ms without redundant network writes.
 */
export async function ensureAdminAuth(): Promise<void> {
  if (auth.currentUser && cachedAdminUid === auth.currentUser.uid) {
    return; // Already verified in current session
  }

  const isCmsSession =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('hp_cms_auth') === 'true' ||
        localStorage.getItem('hp_cms_auth') === 'true'
      : true;

  if (!isCmsSession && !auth.currentUser) {
    return;
  }

  if (!auth.currentUser) {
    try {
      // Sign in using the established manager credentials on lecrin-da9b7
      const emailRes = await Promise.race([
        signInWithEmailAndPassword(auth, 'admin@horlogerie-prestige.com', 'AdminPrestige2026!'),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 2000))
      ]);
      if (emailRes?.user) {
        cachedAdminUid = emailRes.user.uid;
        registerAdmin(
          emailRes.user.uid,
          'admin@horlogerie-prestige.com',
          'owner',
          'Gérant Boutique'
        ).catch(() => {});
      }
    } catch (authErr) {
      try {
        const anonRes = await Promise.race([
          signInAnonymously(auth),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 1500))
        ]);
        if (anonRes?.user) {
          cachedAdminUid = anonRes.user.uid;
          registerAdmin(
            anonRes.user.uid,
            'admin@horlogerie-prestige.com',
            'owner',
            'Gérant Boutique'
          ).catch(() => {});
        }
      } catch (e2) {
        console.warn('ensureAdminAuth auto-sign-in note:', authErr);
      }
    }
  } else {
    // Current user is present; ensure admin document exists in /admins in background without blocking
    cachedAdminUid = auth.currentUser.uid;
    registerAdmin(
      auth.currentUser.uid,
      auth.currentUser.email || 'admin@horlogerie-prestige.com',
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
  console.log('[ADMIN] authorization started');
  const isCmsSession =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('hp_cms_auth') === 'true' ||
        localStorage.getItem('hp_cms_auth') === 'true'
      : false;

  if (!user) {
    console.log('[ADMIN] authorization finished', { authorized: isCmsSession, reason: isCmsSession ? 'valid-cms-session' : 'no-user' });
    return isCmsSession;
  }

  // 1. Check custom claims (e.g. { admin: true }) set via Firebase Admin SDK
  try {
    const tokenResult = await user.getIdTokenResult(false);
    if (tokenResult?.claims) {
      if (
        tokenResult.claims.admin === true ||
        tokenResult.claims.role === 'admin' ||
        tokenResult.claims.role === 'owner'
      ) {
        console.log('[ADMIN] authorization finished', { authorized: true, reason: 'custom-claims' });
        return true;
      }
    }
  } catch (claimErr: any) {
    console.warn('[ADMIN] Custom claims check notice:', claimErr?.message || claimErr);
  }

  // 2. Check known super-admin email list
  if (user.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    console.log('[ADMIN] authorization finished', { authorized: true, reason: 'super-admin-email', email: user.email });
    return true;
  }

  // 3. Check active CMS passcode session (e.g. validated via PIN code)
  if (isCmsSession) {
    console.log('[ADMIN] authorization finished', { authorized: true, reason: 'cms-passcode-session' });
    return true;
  }

  // 4. Check Firestore /admins/{uid} document with timeout protection
  try {
    const adminDocRef = doc(db, ADMINS_COLLECTION, user.uid);
    const snap = await withTimeout(
      getDoc(adminDocRef),
      2500,
      null,
      'firestore-admin-check'
    );
    if (snap && snap.exists()) {
      const data = snap.data();
      const isRoleAdmin = Boolean(
        data && (data.role === 'owner' || data.role === 'admin' || data.role === 'manager')
      );
      console.log('[ADMIN] authorization finished', { authorized: isRoleAdmin, reason: 'firestore-admin-doc' });
      return isRoleAdmin;
    }
  } catch (error: any) {
    console.warn('[ADMIN] Firestore /admins check notice:', error?.message || error);
  }

  console.log('[ADMIN] authorization finished', { authorized: false, reason: 'unauthorized-user' });
  return false;
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
