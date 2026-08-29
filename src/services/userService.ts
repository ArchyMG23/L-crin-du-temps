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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Fetch customer or administrator user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
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
  const path = `${USERS_COLLECTION}/${profile.uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, profile.uid);
    await setDoc(docRef, {
      ...profile,
      role: profile.role || 'customer',
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update user customer profile attributes
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Fetch all registered customers for the Admin CMS
 */
export async function getAllCustomers(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    return snapshot.docs
      .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
      .filter(u => u.role === 'customer' || !u.role);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
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
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
