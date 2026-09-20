import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { withTimeout } from '../utils/async';

const PRIMARY_COLLECTION = 'customers';
const LEGACY_COLLECTION = 'users';

/**
 * Fetch customer or administrator user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, PRIMARY_COLLECTION, uid);
    let snap = await withTimeout(getDoc(docRef), 2500, null, 'firestore-user-profile');

    if (!snap || !snap.exists()) {
      const legacyRef = doc(db, LEGACY_COLLECTION, uid);
      snap = await withTimeout(getDoc(legacyRef), 2000, null, 'firestore-user-profile-legacy');
    }

    if (snap && snap.exists()) {
      const data = snap.data();
      return {
        uid,
        id: uid,
        ...data,
        fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Client de Prestige',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
        address: data.address || '',
        country: data.country || '',
        role: data.role || 'customer',
        ordersCount: Number(data.ordersCount || 0),
        totalSpent: Number(data.totalSpent || 0),
      } as UserProfile;
    }
    return null;
  } catch (error: any) {
    if (error?.code === 'permission-denied' || String(error?.message).includes('insufficient permissions')) {
      console.info('Public guest session: Profile lookup restricted.');
      return null;
    }
    console.warn('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create or initialize customer profile upon registration
 */
export async function createUserProfile(profile: UserProfile): Promise<void> {
  const uid = profile.uid || profile.id;
  if (!uid) return;

  const nowIso = new Date().toISOString();
  const names = (profile.fullName || '').trim().split(' ');
  const firstName = profile.firstName || names[0] || '';
  const lastName = profile.lastName || (names.length > 1 ? names.slice(1).join(' ') : '');

  const payload: UserProfile = {
    ...profile,
    uid,
    id: uid,
    firstName,
    lastName,
    fullName: profile.fullName || `${firstName} ${lastName}`.trim(),
    role: profile.role || 'customer',
    country: profile.country || 'Côte d’Ivoire',
    city: profile.city || '',
    address: profile.address || '',
    phone: profile.phone || '',
    ordersCount: Number(profile.ordersCount || 0),
    totalSpent: Number(profile.totalSpent || 0),
    createdAt: profile.createdAt || nowIso,
    updatedAt: nowIso,
    lastLoginAt: profile.lastLoginAt || nowIso
  };

  try {
    const docRef = doc(db, PRIMARY_COLLECTION, uid);
    await setDoc(docRef, payload, { merge: true });
    // Mirror to legacy users collection
    await setDoc(doc(db, LEGACY_COLLECTION, uid), payload, { merge: true }).catch(() => {});
  } catch (error: any) {
    if (error?.code === 'permission-denied' || String(error?.message).includes('insufficient permissions')) {
      console.info('Profile cloud sync skipped: permission restricted.');
      return;
    }
    handleFirestoreError(error, OperationType.CREATE, `${PRIMARY_COLLECTION}/${uid}`);
  }
}

/**
 * Update user customer profile attributes
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const nowIso = new Date().toISOString();
  const normalized: any = {
    ...data,
    updatedAt: nowIso,
  };

  try {
    const docRef = doc(db, PRIMARY_COLLECTION, uid);
    await updateDoc(docRef, normalized);
    await updateDoc(doc(db, LEGACY_COLLECTION, uid), normalized).catch(() => {});
  } catch (error: any) {
    if (error?.code === 'permission-denied' || String(error?.message).includes('insufficient permissions')) {
      console.info('Profile cloud update skipped: permission restricted.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, `${PRIMARY_COLLECTION}/${uid}`);
  }
}

/**
 * Fetch all registered customers for the Admin CMS
 */
export async function getAllCustomers(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, PRIMARY_COLLECTION);
    let snapshot = await withTimeout(getDocs(colRef), 3000, null, 'firestore-customers-primary');

    if (!snapshot || snapshot.empty) {
      const legacyRef = collection(db, LEGACY_COLLECTION);
      snapshot = await withTimeout(getDocs(legacyRef), 2000, null, 'firestore-customers-legacy');
    }

    if (!snapshot || snapshot.empty) {
      return [];
    }

    return snapshot.docs
      .map(d => {
        const data = d.data();
        return {
          uid: d.id,
          id: d.id,
          ...data,
          fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Client',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || '',
          address: data.address || '',
          country: data.country || '',
          role: data.role || 'customer',
          ordersCount: Number(data.ordersCount || 0),
          totalSpent: Number(data.totalSpent || 0),
        } as UserProfile;
      })
      .filter(u => u.role === 'customer' || !u.role);
  } catch (error: any) {
    if (error?.code === 'permission-denied' || String(error?.message).includes('insufficient permissions')) {
      return [];
    }
    console.warn('getAllCustomers notice:', error);
    return [];
  }
}

/**
 * Delete a user profile (used by admin or during complete boutique reset)
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    const docRef = doc(db, PRIMARY_COLLECTION, uid);
    await deleteDoc(docRef);
    await deleteDoc(doc(db, LEGACY_COLLECTION, uid)).catch(() => {});
  } catch (error: any) {
    if (error?.code === 'permission-denied' || String(error?.message).includes('insufficient permissions')) {
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, `${PRIMARY_COLLECTION}/${uid}`);
  }
}
