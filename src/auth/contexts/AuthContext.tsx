
import { createContext } from 'react';
import type { AuthContextValue } from '../types/AuthReducerInterfaces';

export const AuthContext = createContext<AuthContextValue | null>(null);
