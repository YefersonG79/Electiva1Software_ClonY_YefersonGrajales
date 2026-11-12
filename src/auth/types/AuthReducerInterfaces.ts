
export interface User {
    uid: string;
    fullName: string;
    username: string;
    email: string;
    photoURL: string | null;
}

export interface AuthState {
    logged: boolean;
    user: User | null;
    errorMessage: string | null;
}

export interface AuthContextValue {
    authState: AuthState;
    login: (username: string, profile?: Pick<User, 'fullName' | 'email'>) => void;
    logout: () => void;
}

export type AuthReducerAction =
    | { type: 'login'; payload: User }
    | { type: 'logout' }
    | { type: 'error'; payload: string };
