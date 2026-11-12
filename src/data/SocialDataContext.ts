import { createContext } from 'react';
import type { User } from '../auth/types/AuthReducerInterfaces';
import type { Relationship } from './types';

export interface SocialData {
    users: User[];
    relationships: Relationship[];
    loading: boolean;
    error: string | null;
}

export const SocialDataContext = createContext<SocialData | null>(null);
