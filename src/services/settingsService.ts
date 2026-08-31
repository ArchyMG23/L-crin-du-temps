import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { StoreSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/defaultData';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'general';
const LOCAL_SETTINGS_KEY = 'hp_store_settings';

/**
 * Fetch global boutique settings from Firestore with local storage cache persistence fallback
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  // Retrieve any locally saved overrides for instant local responsiveness
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
      const data = snap.data();
      const merged: StoreSettings = {
        ...DEFAULT_SETTINGS,
        ...data,
        ...localOverrides,
        // Ensure critical fields are never undefined
        storeName: data.storeName || localOverrides.storeName || DEFAULT_SETTINGS.storeName,
        whatsappNumber: data.whatsappNumber || localOverrides.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,
        whatsappDefaultMessage: data.whatsappDefaultMessage || localOverrides.whatsappDefaultMessage || DEFAULT_SETTINGS.whatsappDefaultMessage,
        currency: data.currency || localOverrides.currency || DEFAULT_SETTINGS.currency,
        logo: data.logo || localOverrides.logo || DEFAULT_SETTINGS.logo,
        logoUrl: data.logoUrl || localOverrides.logoUrl || DEFAULT_SETTINGS.logoUrl,
        faviconUrl: data.faviconUrl || localOverrides.faviconUrl || DEFAULT_SETTINGS.faviconUrl
      };
      
      // Update local cache with remote state
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
      } catch {
        // Ignore quota issues
      }

      return merged;
    }
    return { ...DEFAULT_SETTINGS, ...localOverrides };
  } catch (error) {
    console.warn('Store settings fetch notice, using default/cached configuration:', error);
    return { ...DEFAULT_SETTINGS, ...localOverrides };
  }
}

/**
 * Update boutique settings in both Firestore and local storage
 */
export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  const current = await getStoreSettings();
  
  const payload: StoreSettings = {
    storeName: settings.storeName?.trim() || settings.name?.trim() || current.storeName || DEFAULT_SETTINGS.storeName,
    name: settings.name?.trim() || settings.storeName?.trim() || current.name || DEFAULT_SETTINGS.name,
    description: settings.description !== undefined ? settings.description : (current.description || DEFAULT_SETTINGS.description),
    logo: settings.logo ?? current.logo ?? DEFAULT_SETTINGS.logo,
    logoUrl: settings.logoUrl ?? settings.logo ?? current.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
    faviconUrl: settings.faviconUrl ?? current.faviconUrl ?? DEFAULT_SETTINGS.faviconUrl,
    whatsappNumber: settings.whatsappNumber?.trim() || current.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,
    whatsappDefaultMessage: settings.whatsappDefaultMessage !== undefined ? settings.whatsappDefaultMessage : (current.whatsappDefaultMessage || DEFAULT_SETTINGS.whatsappDefaultMessage),
    currency: settings.currency || current.currency || DEFAULT_SETTINGS.currency,
    defaultLowStockThreshold: settings.defaultLowStockThreshold ?? current.defaultLowStockThreshold ?? 2,
    shippingEnabled: settings.shippingEnabled ?? current.shippingEnabled ?? true,
    shippingFee: settings.shippingFee ?? current.shippingFee ?? 0,
    shippingMessage: settings.shippingMessage !== undefined ? settings.shippingMessage : (current.shippingMessage ?? ''),
    socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...current.socialLinks, ...settings.socialLinks },
    contactInformation: { ...DEFAULT_SETTINGS.contactInformation, ...current.contactInformation, ...settings.contactInformation }
  };

  // 1. Persist locally immediately so the UI is 100% updated synchronously across tabs/refreshes
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore local storage quota issues
  }

  // 2. Persist to Firestore cloud database
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.warn('Firestore settings sync notice:', error);
    if (auth.currentUser) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  return payload;
}

