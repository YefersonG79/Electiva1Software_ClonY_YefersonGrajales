
export interface User {
    uid: string;
    fullName: string;
    username: string;
    email?: string;
    photoURL: string | null;
}

export interface AuthState {
    loading: boolean;
    logged: boolean;
    user: User | null;
    errorMessage: string | null;
}

export interface AuthContextValue {
    authState: AuthState;
    login: (username: string, password: string) => Promise<void>;
    register: (input: import('../../services/auth').RegistrationInput) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

export type AuthReducerAction =
    | { type: 'login'; payload: User }
    | { type: 'loading' }
    | { type: 'logout' }
    | { type: 'error'; payload: string };
