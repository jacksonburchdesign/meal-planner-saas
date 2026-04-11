import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app, 'us-central1');

export { auth, db, storage } from '../../../config/firebase';

// Mock googleProvider for AuthContext
import { GoogleAuthProvider } from 'firebase/auth';
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' }); // Enforce account selection overlay


// Local emulators temporarily disabled to securely test your live Production backend from localhost!
// if (import.meta.env.DEV) {
//   connectFirestoreEmulator(db, '127.0.0.1', 8080);
//   connectFunctionsEmulator(functions, '127.0.0.1', 5001);
// }

// Initialize Analytics conditionally (it expects window context)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
