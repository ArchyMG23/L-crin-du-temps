import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import config from '../../firebase-applet-config.json';

// Determine Firebase configuration (supporting local console project override if set)
const getEffectiveFirebaseConfig = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('hp_custom_firebase_config');
      if (stored) {
        const custom = JSON.parse(stored);
        if (custom.projectId) {
          return {
            apiKey: custom.apiKey || config.apiKey,
            authDomain: custom.authDomain || `${custom.projectId}.firebaseapp.com`,
            projectId: custom.projectId,
            storageBucket: custom.storageBucket || `${custom.projectId}.firebasestorage.app`,
            messagingSenderId: custom.messagingSenderId || config.messagingSenderId,
            appId: custom.appId || config.appId,
          };
        }
      }
    } catch {}
  }
  return {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };
};

export const activeFirebaseConfig = getEffectiveFirebaseConfig();
console.log(`[Firebase]\nprojectId = ${activeFirebaseConfig.projectId}`);

const firebaseConfig = activeFirebaseConfig;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase App Check if recaptchaSiteKey is provided
if (typeof window !== 'undefined' && config.recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(config.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.info('Firebase App Check successfully initialized.');
  } catch (appCheckErr) {
    console.warn('App Check initialization notice:', appCheckErr);
  }
}

// Initialize Firestore directly on the (default) database with force long polling for reliable operation in web sandbox and iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

console.log('[BOOT] Firebase initialized');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || (rawMsg.includes('NOT_FOUND') ? 'not-found' : 'unknown');

  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };
  console.error('[FIRESTORE ERROR]', JSON.stringify(errInfo, null, 2));

  let readableMessage = rawMsg;
  if (errCode === 'permission-denied' || rawMsg.includes('Missing or insufficient permissions')) {
    readableMessage = `Permission Firestore refusée (${errCode}) sur le chemin "${path}". Un compte administrateur est requis.`;
  } else if (errCode === 'not-found' || rawMsg.includes('does not exist') || rawMsg.includes('NOT_FOUND')) {
    readableMessage = `La base Firestore "(default)" n'existe pas sur le projet "${activeFirebaseConfig.projectId}". Veuillez vérifier le projet dans la console Firebase.`;
  } else if (rawMsg.includes('timeout')) {
    readableMessage = `Délai d'attente Firestore dépassé lors de l'opération ${operationType} sur "${path}".`;
  }

  const enhancedError = new Error(readableMessage);
  (enhancedError as any).details = errInfo;
  (enhancedError as any).code = errCode;
  throw enhancedError;
}

// Connection test helper (only called on demand, not blocking boot)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('backend')) {
      // Expected notice when initializing or in restricted environment
      return false;
    }
    return false;
  }
}

export default app;

