import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Import existing central app instance so we don't accidentally initialize twice
import { app, auth, db, storage } from '../../../config/firebase';

export const functions = getFunctions(app, 'us-central1');

export { app, auth, db, storage };

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
