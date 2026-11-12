import { useEffect, useState, type ReactNode } from 'react';
import { collection, collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../auth/hooks/useAuth';
import type { User } from '../auth/types/AuthReducerInterfaces';
import { requireFirebase } from '../firebase/config';
import { errorMessage } from '../services/errors';
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
        let failed = false;
        const update = () => {
            if (!active || failed) return;
            const unique = new Map(edges.flat().map((edge) => [`${edge.followerId}:${edge.followingId}`, edge]));
            setState({ uid, users, relationships: [...unique.values()], loading: !ready.every(Boolean), error: null });
        };
        const fail = (error: unknown) => {
            failed = true;
            if (active) setState({ uid, users: [], relationships: [], loading: false, error: errorMessage(error) });
        };
        const stops = [onSnapshot(collection(db, 'users'), (snapshot) => {
            users = snapshot.docs.map((item) => item.data() as User);
            ready[0] = true;
            update();
        }, fail)];
        ['followerId', 'followingId'].forEach((field, index) => {
            stops.push(onSnapshot(query(collectionGroup(db, 'followEdges'), where(field, '==', uid)), (snapshot) => {
                edges[index] = snapshot.docs.map((item) => item.data() as Relationship);
                ready[index + 1] = true;
                update();
            }, fail));
        });
        return () => { active = false; stops.forEach((stop) => stop()); };
    }, [uid]);

    const value = state.uid === uid && uid ? state : { users: [], relationships: [], loading: !!uid, error: null };
    return <SocialDataContext.Provider value={value}>{children}</SocialDataContext.Provider>;
};
