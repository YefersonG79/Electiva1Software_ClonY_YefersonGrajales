import type { FirebaseApp as FirebaseAppInstance } from 'firebase/app';
import type { Auth } from 'firebase/auth';

// Keep the reference exports available without initializing a remote service.
// Milestone 1 uses AuthProvider and MockDataProvider exclusively.
export const FirebaseApp: FirebaseAppInstance | null = null;
export const FirebaseAuth: Auth | null = null;
