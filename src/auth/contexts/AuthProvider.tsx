
import { useReducer, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { authReducer } from '../reducers/AuthReducer';
import type { AuthState, User } from '../types/AuthReducerInterfaces';
import { demoUser } from '../../data/mockUsers';

const initialState: AuthState = {
    logged: false,
    user: null,
    errorMessage: null,
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [authState, dispatch] = useReducer(authReducer, initialState);

    const login = (username: string, profile?: Pick<User, 'fullName' | 'email'>) => {
        dispatch({
            type: 'login',
            payload: {
                ...demoUser,
                ...profile,
                username: username.trim().replace(/^@/, '') || demoUser.username,
            },
        });
    };

    const logout = () => dispatch({ type: 'logout' });

    return (
        <AuthContext.Provider value={{ authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
