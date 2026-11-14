import { useEffect, useState } from 'react';
import { collectionGroup, query, where } from 'firebase/firestore';
import { requireFirebase } from '../firebase/config';
import type { Relationship } from '../data/types';
import { errorMessage } from '../services/errors';
import { subscribeToQuery } from '../services/firestoreQueries';

export const useUserConnections = (userId: string | undefined, mode: 'following' | 'followers') => {
    const key = `${userId}:${mode}`;
    const [state, setState] = useState<{ key: string; relationships: Relationship[]; loading: boolean; error: string | null }>({
        key: '', relationships: [], loading: true, error: null,
    });
    useEffect(() => {
        if (!userId) return;
        const { db } = requireFirebase();
        const field = mode === 'following' ? 'followerId' : 'followingId';
        return subscribeToQuery(query(collectionGroup(db, 'followEdges'), where(field, '==', userId)),
            `followEdges: ${field} == UID (lista de perfil)`,
            (snapshot) => {
                if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
                setState({ key, relationships: snapshot.docs.map((item) => item.data() as Relationship), loading: false, error: null });
            },
            (error) => setState({ key, relationships: [], loading: false, error: errorMessage(error) }));
    }, [userId, mode, key]);
    return state.key === key ? state : { relationships: [], loading: !!userId, error: null };
};
