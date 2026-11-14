import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

const emulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const options = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (emulators ? 'demo-key' : ''),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (emulators ? 'demo-clon-y.firebaseapp.com' : ''),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (emulators ? 'demo-clon-y' : ''),
    appId: import.meta.env.VITE_FIREBASE_APP_ID || (emulators ? 'demo-app' : ''),
};
const configured = Object.values(options).every(Boolean);
const existing = getApps().length > 0;

export const FirebaseApp = configured ? (existing ? getApp() : initializeApp(options)) : null;
export const FirebaseAuth = FirebaseApp ? getAuth(FirebaseApp) : null;
export const FirebaseDb = FirebaseApp ? getFirestore(FirebaseApp) : null;
export const FirebaseFunctions = FirebaseApp
    ? getFunctions(FirebaseApp, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1') : null;

if (emulators && !existing && FirebaseAuth && FirebaseDb && FirebaseFunctions) {
    connectAuthEmulator(FirebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(FirebaseDb, '127.0.0.1', 8080);
    connectFunctionsEmulator(FirebaseFunctions, '127.0.0.1', 5001);
}

export const requireFirebase = () => {
    if (!FirebaseAuth || !FirebaseDb || !FirebaseFunctions) {
        throw new Error('El servicio no está configurado. Inténtalo de nuevo más tarde.');
    }
    return { auth: FirebaseAuth, db: FirebaseDb, functions: FirebaseFunctions };
};
