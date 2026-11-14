import { useEffect, useState, type ReactNode } from 'react';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import { useAuth } from '../auth/hooks/useAuth';
import type { User } from '../auth/types/AuthReducerInterfaces';
import { requireFirebase } from '../firebase/config';
import { errorMessage } from '../services/errors';
import { subscribeToQuery } from '../services/firestoreQueries';
import { SocialDataContext, type SocialData } from './SocialDataContext';
import type { Relationship } from './types';

export const SocialDataProvider = ({ children }: { children: ReactNode }) => {
    const { authState } = useAuth();
    const uid = authState.user?.uid;
    const [state, setState] = useState<SocialData & { uid?: string }>({ users: [], relationships: [], loading: true, error: null });

    useEffect(() => {
        if (!uid) return;
        const { db } = requireFirebase();
        let active = true;
        let users: User[] = [];
        const edges: Relationship[][] = [[], []];
        const ready = [false, false, false];
        const errors = ['', '', ''];
        const update = () => {
            if (!active) return;
            const unique = new Map(edges.flat().map((edge) => [`${edge.followerId}:${edge.followingId}`, edge]));
            setState({ uid, users, relationships: [...unique.values()], loading: !ready.every(Boolean), error: errors.find(Boolean) || null });
        };
        const fail = (index: number) => (error: unknown) => {
            ready[index] = true;
            errors[index] = errorMessage(error);
            update();
        };
        const stops = [subscribeToQuery(collection(db, 'users'), 'users: perfiles de la comunidad', (snapshot) => {
            users = snapshot.docs.map((item) => item.data() as User);
            ready[0] = true;
            errors[0] = '';
            update();
        }, fail(0))];
        ['followerId', 'followingId'].forEach((field, index) => {
            stops.push(subscribeToQuery(query(collectionGroup(db, 'followEdges'), where(field, '==', uid)), `followEdges: ${field} == UID (comunidad)`, (snapshot) => {
                edges[index] = snapshot.docs.map((item) => item.data() as Relationship);
                ready[index + 1] = true;
                errors[index + 1] = '';
                update();
            }, fail(index + 1)));
        });
        return () => { active = false; stops.forEach((stop) => stop()); };
    }, [uid]);

    const value = state.uid === uid && uid ? state : { users: [], relationships: [], loading: !!uid, error: null };
    return <SocialDataContext.Provider value={value}>{children}</SocialDataContext.Provider>;
};
