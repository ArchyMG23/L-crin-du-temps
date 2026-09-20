import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };

async function test() {
  console.log('Testing with projectId:', config.projectId);
  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Testing signInAnonymously...');
  try {
    const cred = await signInAnonymously(auth);
    console.log('Anonymous sign-in SUCCESS, uid:', cred.user.uid);
  } catch (err: any) {
    console.error('Anonymous sign-in FAILED:', err?.code, err?.message);
  }

  console.log('Current user:', auth.currentUser ? { uid: auth.currentUser.uid, isAnonymous: auth.currentUser.isAnonymous, email: auth.currentUser.email } : 'null');

  console.log('Testing writing to products collection...');
  try {
    const testDoc = doc(collection(db, 'products'));
    await setDoc(testDoc, {
      name: 'Diagnostic Watch',
      active: true,
      price: 1000
    });
    console.log('Firestore write SUCCESS, id:', testDoc.id);
  } catch (err: any) {
    console.error('Firestore write FAILED:', err?.code, err?.message);
  }
}

test().catch(console.error);
