import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { User } from '../auth/types/AuthReducerInterfaces';
import { requireFirebase } from '../firebase/config';
import { validateUsername } from './validation';

export const findUserByUsername = async (value: string): Promise<User | null> => {
    const username = validateUsername(value);
    const { db } = requireFirebase();
    const reservation = await getDoc(doc(db, 'usernames', username));
    if (!reservation.exists()) return null;
    const profile = await getDoc(doc(db, 'users', reservation.data().uid));
    return profile.exists() ? profile.data() as User : null;
};

export const createUserProfile = async (identity: FirebaseUser, fullName: string, value: string) => {
    const { db } = requireFirebase();
    const username = validateUsername(value);
    const profile: User = { uid: identity.uid, fullName, username, photoURL: null };
    await runTransaction(db, async (transaction) => {
        const nameRef = doc(db, 'usernames', username);
        const profileRef = doc(db, 'users', identity.uid);
        const [name, existingProfile] = await Promise.all([transaction.get(nameRef), transaction.get(profileRef)]);
        if (existingProfile.exists()) return;
        if (name.exists()) throw new Error('Este nombre de usuario ya está ocupado.');
        const createdAt = serverTimestamp();
        transaction.set(nameRef, { uid: identity.uid, createdAt });
        transaction.set(profileRef, { ...profile, createdAt });
        transaction.set(doc(db, 'privateUsers', identity.uid), { uid: identity.uid, email: identity.email, createdAt });
    });
};

export const ensureGoogleProfile = async (identity: FirebaseUser) => {
    const { db } = requireFirebase();
    if ((await getDoc(doc(db, 'users', identity.uid))).exists()) return;
    const fullName = (identity.displayName?.trim() || 'Usuario de Google').slice(0, 100);
    const stem = (fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '').slice(0, 18) || 'usuario');
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
        try {
            await createUserProfile(identity, fullName, `${stem}_${suffix}`);
            return;
        } catch (error) {
            if (!(error instanceof Error) || error.message !== 'Este nombre de usuario ya está ocupado.') throw error;
        }
    }
    throw new Error('No se pudo reservar un usuario para Google. Inténtalo de nuevo.');
};
