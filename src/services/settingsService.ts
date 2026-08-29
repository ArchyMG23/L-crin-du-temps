import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { StoreSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/defaultData';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'general';
const LOCAL_SETTINGS_KEY = 'hp_store_settings';

/**
 * Fetch global boutique settings
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  // Retrieve any locally saved overrides
  let localOverrides: Partial<StoreSettings> = {};
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (raw) {
      localOverrides = JSON.parse(raw);
    }
  } catch {
    // Ignore JSON parse errors
  }

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const merged = { ...DEFAULT_SETTINGS, ...snap.data(), ...localOverrides } as StoreSettings;
      return merged;
    }
    return { ...DEFAULT_SETTINGS, ...localOverrides };
  } catch (error) {
    console.warn('Store settings fetch notice, using default configuration:', error);
    return { ...DEFAULT_SETTINGS, ...localOverrides };
  }
}

/**
 * Update boutique settings
 */
export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  
  // Persist locally immediately
  try {
    const current = await getStoreSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore local storage quota issues
  }

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const current = await getStoreSettings();
    const payload: StoreSettings = {
      storeName: settings.storeName || current.storeName || DEFAULT_SETTINGS.storeName,
      logo: settings.logo ?? current.logo ?? DEFAULT_SETTINGS.logo,
      whatsappNumber: settings.whatsappNumber || current.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,
      currency: settings.currency || current.currency || DEFAULT_SETTINGS.currency,
      defaultLowStockThreshold: settings.defaultLowStockThreshold ?? current.defaultLowStockThreshold ?? 2,
      shippingEnabled: settings.shippingEnabled ?? current.shippingEnabled ?? true,
      shippingFee: settings.shippingFee ?? current.shippingFee ?? 0,
      shippingMessage: settings.shippingMessage ?? current.shippingMessage ?? '',
      socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...current.socialLinks, ...settings.socialLinks },
      contactInformation: { ...DEFAULT_SETTINGS.contactInformation, ...current.contactInformation, ...settings.contactInformation }
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.warn('Firestore settings sync notice:', error);
    if (auth.currentUser) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}
