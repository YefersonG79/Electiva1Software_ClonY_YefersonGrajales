
import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { MockDataContext } from './MockDataContext';
import { mockUsers } from './mockUsers';
import { mockTweets } from './mockTweets';
import { mockRelationships } from './mockRelationships';

export const MockDataProvider = ({ children }: { children: ReactNode }) => {
    const { authState } = useAuth();
    const [tweets, setTweets] = useState(mockTweets);
    const [relationships, setRelationships] = useState(mockRelationships);
    const user = authState.user;
    const users = mockUsers.map((item) => item.uid === user?.uid ? user : item);

    const publishTweet = (content: string) => {
        if (!user || !content.trim()) return;
        setTweets((previous) => [{
            id: crypto.randomUUID(),
            authorId: user.uid,
            content: content.trim(),
            createdAt: new Date().toISOString(),
        }, ...previous]);
    };

    const followUser = (userId: string) => {
        if (!user || userId === user.uid) return;
        setRelationships((previous) =>
            previous.some((item) => item.followerId === user.uid && item.followingId === userId)
                ? previous
                : [...previous, { followerId: user.uid, followingId: userId }],
        );
    };

    return (
        <MockDataContext.Provider value={{ users, tweets, relationships, publishTweet, followUser }}>
            {children}
        </MockDataContext.Provider>
    );
};
