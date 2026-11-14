import { useEffect, useReducer, type ReactNode } from 'react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { AuthContext } from './AuthContext';
import { authReducer } from '../reducers/AuthReducer';
import type { AuthState, User } from '../types/AuthReducerInterfaces';
import { requireFirebase } from '../../firebase/config';
import { registerUser, signInWithCredentials, signInWithGoogle } from '../../services/auth';
import { errorMessage } from '../../services/errors';

const initialState: AuthState = { loading: true, logged: false, user: null, errorMessage: null };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [authState, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        let active = true;
        let stopAuth = () => {};
        let stopProfile = () => {};
        let generation = 0;
        const fail = (error: unknown) => {
            if (active) dispatch({ type: 'error', payload: errorMessage(error) });
        };
        const start = async () => {
            const { auth, db } = requireFirebase();
            await setPersistence(auth, browserLocalPersistence);
            if (!active) return;
            stopAuth = onAuthStateChanged(auth, (identity) => {
                const currentGeneration = ++generation;
                stopProfile();
                if (!identity) { dispatch({ type: 'logout' }); return; }
                dispatch({ type: 'loading' });
                stopProfile = onSnapshot(doc(db, 'users', identity.uid), (snapshot) => {
                    if (!active || generation !== currentGeneration) return;
                    if (!snapshot.exists()) {
                        dispatch({ type: 'error', payload: 'El perfil aún no está disponible. Completa el registro o vuelve a entrar con Google.' });
                        return;
                    }
                    dispatch({ type: 'login', payload: { ...snapshot.data() as User, email: identity.email || undefined } });
                }, fail);
            }, fail);
        };
        void start().catch(fail);
        return () => { active = false; stopAuth(); stopProfile(); };
    }, []);

    const logout = async () => { await signOut(requireFirebase().auth); };

    return (
        <AuthContext.Provider value={{ authState, login: signInWithCredentials, register: registerUser, loginWithGoogle: signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
