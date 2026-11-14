import { useEffect, useState } from 'react';
import { collectionGroup, query, where } from 'firebase/firestore';
import { requireFirebase } from '../firebase/config';
import { errorMessage } from '../services/errors';
import { subscribeToQuery } from '../services/firestoreQueries';

export const useUserStats = (uid: string) => {
    const [state, setState] = useState({ uid: '', following: 0, followers: 0, loading: true, error: '' });
    useEffect(() => {
        const { db } = requireFirebase();
        let active = true;
        const counts = [0, 0];
        const ready = [false, false];
        const errors = ['', ''];
        const update = () => {
            if (active) setState({ uid, following: counts[0], followers: counts[1], loading: !ready.every(Boolean), error: errors.find(Boolean) || '' });
        };
        const stops = ['followerId', 'followingId'].map((field, index) => subscribeToQuery(
            query(collectionGroup(db, 'followEdges'), where(field, '==', uid)),
            `followEdges: ${field} == UID (contador)`,
            (snapshot) => { counts[index] = snapshot.size; ready[index] = true; errors[index] = ''; update(); },
            (error) => { ready[index] = true; errors[index] = errorMessage(error); update(); },
        ));
        return () => { active = false; stops.forEach((stop) => stop()); };
    }, [uid]);
    return state.uid === uid ? state : { following: 0, followers: 0, loading: true, error: '' };
};
