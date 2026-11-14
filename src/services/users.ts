import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { User } from '../auth/types/AuthReducerInterfaces';
import { requireFirebase } from '../firebase/config';
import { validateUsername } from './validation';

export const isUsernameAvailable = async (value: string): Promise<boolean> => {
    const username = validateUsername(value);
    const { db } = requireFirebase();
    return !(await getDocFromServer(doc(db, 'usernames', username))).exists();
};

export const changeUsername = async (value: string): Promise<string> => {
    const username = validateUsername(value);
    const { auth, db } = requireFirebase();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Inicia sesión para cambiar tu nombre de usuario.');

    await runTransaction(db, async (transaction) => {
        const profileRef = doc(db, 'users', uid);
        const profile = await transaction.get(profileRef);
        if (!profile.exists()) throw new Error('No se encontró tu perfil. Vuelve a iniciar sesión.');
        const previousUsername = profile.data().username as string;
        if (previousUsername === username) return;

        const previousRef = doc(db, 'usernames', previousUsername);
        const nextRef = doc(db, 'usernames', username);
        const [previous, next] = await Promise.all([transaction.get(previousRef), transaction.get(nextRef)]);
        if (next.exists()) throw new Error('Este nombre de usuario ya está ocupado.');
        if (!previous.exists() || previous.data().uid !== uid) {
            throw new Error('No se pudo confirmar tu nombre actual. Inténtalo de nuevo más tarde.');
        }

        // All three writes commit together. A failure leaves the old reservation intact.
        transaction.set(nextRef, { uid, createdAt: serverTimestamp() });
        transaction.update(profileRef, { username });
        transaction.delete(previousRef);
    }).catch(async (failure: unknown) => {
        // Under contention rules may reject a stale write before the SDK retries.
        // Recheck the target to present an availability conflict accurately.
        if (typeof failure === 'object' && failure && 'code' in failure
            && (failure.code === 'permission-denied' || failure.code === 'aborted')) {
            let taken = false;
            try {
                const reservation = await getDocFromServer(doc(db, 'usernames', username));
                taken = reservation.exists() && reservation.data().uid !== uid;
            } catch { /* Preserve the original error when the server cannot be reached. */ }
            if (taken) throw new Error('Este nombre de usuario ya está ocupado.');
        }
        throw failure;
    });
    return username;
};

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
