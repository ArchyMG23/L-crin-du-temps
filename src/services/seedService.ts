import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/defaultData';

/**
 * Check function (does NOT automatically insert data into Firestore without user consent)
 */
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  return false;
}

export async function forceSeedData(): Promise<void> {
  // 1. Seed categories
  for (const cat of DEFAULT_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), cat);
  }

  // 2. Seed products
  for (const prod of DEFAULT_PRODUCTS) {
    await setDoc(doc(db, 'products', prod.id), prod);
  }

  // 3. Seed settings
  await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
}
