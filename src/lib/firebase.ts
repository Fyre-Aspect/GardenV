/**
 * Firebase client initialisation.
 *
 * Reads config from `NEXT_PUBLIC_FIREBASE_*` env vars (see `.env.example`).
 * These keys are safe to expose to the browser — access is governed by
 * Firebase Auth + Firestore security rules, not by key secrecy.
 *
 * Firestore is initialised with a persistent (IndexedDB) cache so the app keeps
 * working offline — which is what makes the PWA genuinely useful, not just
 * installable.
 */
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Reuse the existing app across HMR reloads / RSC boundaries instead of
// re-initialising (which throws "Firebase App named '[DEFAULT]' already exists").
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

// `initializeFirestore` (vs `getFirestore`) lets us opt into the persistent
// cache up front. Guard the multi-tab manager call so a second module import
// during HMR doesn't try to initialise Firestore twice.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/** Analytics only runs in a supported browser context; never during SSR. */
let analyticsPromise: Promise<Analytics | null> | null = null;
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!firebaseConfig.measurementId) return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((ok) => (ok ? getAnalytics(app) : null));
  }
  return analyticsPromise;
}
