import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const rawApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
const rawProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();

// Vérification stricte de la configuration Firebase
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  rawProjectId &&
  rawApiKey !== 'MY_FIREBASE_API_KEY' &&
  !rawApiKey.startsWith('MY_') &&
  rawApiKey.length > 10
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: rawApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${rawProjectId}.firebaseapp.com`,
      projectId: rawProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${rawProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    console.log('[Yoon VTC - Firebase] Initialisation réussie avec le projet :', rawProjectId);
  } catch (error) {
    console.warn('[Yoon VTC - Firebase] Erreur lors de l\'initialisation :', error);
  }
} else {
  console.info(
    '[Yoon VTC - Firebase] Mode Démo / Simulation actif. Les clés VITE_FIREBASE_* ne sont pas définies ou sont des placeholders. Toutes les opérations VTC (demandes, courses, paiements Wave/OM) fonctionnent sans erreur en mode local.'
  );
}

export const app = appInstance as FirebaseApp;
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export const storage = storageInstance as FirebaseStorage;

export default { app, auth, db, storage, isFirebaseConfigured };

