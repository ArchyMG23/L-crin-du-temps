import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { StoreSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/defaultData';
import { ensureAdminAuth } from './adminService';

const SETTINGS_COLLECTION = 'settings';
const PRIMARY_DOC_ID = 'store';
const LEGACY_DOC_ID = 'general';
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
    let docRef = doc(db, SETTINGS_COLLECTION, PRIMARY_DOC_ID);
    let snap = await getDoc(docRef);

    if (!snap.exists()) {
      docRef = doc(db, SETTINGS_COLLECTION, LEGACY_DOC_ID);
      snap = await getDoc(docRef);
    }

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
        logoUrl: data.logoUrl || localOverrides.logoUrl || data.logo || DEFAULT_SETTINGS.logoUrl,
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
 * Update boutique settings in both Firestore and local storage.
 * Enforces admin role check and strict field validations.
 */
export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  await ensureAdminAuth();

  const current = await getStoreSettings();
  const nowIso = new Date().toISOString();

  // Validate and clean WhatsApp phone number if provided
  let cleanWhatsApp = current.whatsappNumber;
  if (settings.whatsappNumber !== undefined) {
    const rawNum = settings.whatsappNumber.trim();
    if (rawNum && !/^\+?[0-9\s-]{6,25}$/.test(rawNum)) {
      throw new Error('Numéro WhatsApp invalide. Utilisez un format international valide (ex: +225 0700000000).');
    }
    cleanWhatsApp = rawNum;
  }
  
  const payload: StoreSettings = {
    storeName: settings.storeName?.trim() || settings.name?.trim() || current.storeName || DEFAULT_SETTINGS.storeName,
    name: settings.name?.trim() || settings.storeName?.trim() || current.name || DEFAULT_SETTINGS.name,
    description: settings.description !== undefined ? settings.description : (current.description || DEFAULT_SETTINGS.description),
    logo: settings.logo ?? current.logo ?? DEFAULT_SETTINGS.logo,
    logoUrl: settings.logoUrl ?? settings.logo ?? current.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
    faviconUrl: settings.faviconUrl ?? current.faviconUrl ?? DEFAULT_SETTINGS.faviconUrl,
    whatsappNumber: cleanWhatsApp,
    whatsappDefaultMessage: settings.whatsappDefaultMessage !== undefined ? settings.whatsappDefaultMessage : (current.whatsappDefaultMessage || DEFAULT_SETTINGS.whatsappDefaultMessage),
    currency: settings.currency || current.currency || DEFAULT_SETTINGS.currency,
    defaultLowStockThreshold: Math.max(0, Math.floor(Number(settings.defaultLowStockThreshold ?? current.defaultLowStockThreshold ?? 2))),
    shippingEnabled: settings.shippingEnabled ?? current.shippingEnabled ?? true,
    shippingFee: Math.max(0, Number(settings.shippingFee ?? current.shippingFee ?? 0)),
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

  // 2. Persist to Firestore cloud database (both store and general documents)
  try {
    const storeRef = doc(db, SETTINGS_COLLECTION, PRIMARY_DOC_ID);
    const generalRef = doc(db, SETTINGS_COLLECTION, LEGACY_DOC_ID);
    await setDoc(storeRef, { ...payload, updatedAt: nowIso }, { merge: true });
    await setDoc(generalRef, { ...payload, updatedAt: nowIso }, { merge: true }).catch(() => {});
  } catch (error) {
    console.warn('Firestore settings sync notice:', error);
    if (auth.currentUser) {
      handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${PRIMARY_DOC_ID}`);
    }
  }

  return payload;
}

