
import { createContext } from 'react';
import type { User } from '../auth/types/AuthReducerInterfaces';
import type { Relationship, Tweet } from './types';

export interface MockDataContextValue {
    users: User[];
    tweets: Tweet[];
    relationships: Relationship[];
    publishTweet: (content: string) => void;
    followUser: (userId: string) => void;
}

export const MockDataContext = createContext<MockDataContextValue | null>(null);
