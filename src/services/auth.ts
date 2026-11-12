import {
    createUserWithEmailAndPassword, deleteUser, GoogleAuthProvider,
    signInWithCustomToken, signInWithPopup, signOut,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { requireFirebase } from '../firebase/config';
import { createUserProfile, ensureGoogleProfile } from './users';
import { validateUsername } from './validation';

export interface RegistrationInput { fullName: string; username: string; email: string; password: string }

export const registerUser = async (input: RegistrationInput) => {
    const fullName = input.fullName.trim();
    const username = validateUsername(input.username);
    const email = input.email.trim();
    if (!fullName || fullName.length > 100) throw new Error('Escribe un nombre completo de hasta 100 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escribe un correo electrónico válido.');
    if (input.password.length < 6) throw new Error('Usa una contraseña de al menos 6 caracteres.');
    const { auth } = requireFirebase();
    const { user } = await createUserWithEmailAndPassword(auth, email, input.password);
    try {
        await createUserProfile(user, fullName, username);
    } catch (error) {
        try { await deleteUser(user); }
        catch {
            await signOut(auth);
            throw new Error('No se completó el perfil ni se pudo revertir la cuenta. Solicita al administrador eliminar la cuenta incompleta antes de registrarte de nuevo.');
        }
        throw error;
    }
};

export const signInByUsername = async (value: string, password: string) => {
    const username = validateUsername(value);
    if (!password) throw new Error('Escribe tu contraseña.');
    const { auth, functions } = requireFirebase();
    const signIn = httpsCallable<{ username: string; password: string }, { token: string }>(functions, 'signInWithUsername');
    const { data } = await signIn({ username, password });
    await signInWithCustomToken(auth, data.token);
};

export const signInWithGoogle = async () => {
    const { auth } = requireFirebase();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const { user } = await signInWithPopup(auth, provider);
    try { await ensureGoogleProfile(user); }
    catch (error) { await signOut(auth); throw error; }
};
