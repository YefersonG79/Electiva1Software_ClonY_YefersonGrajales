import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { requireFirebase } from '../firebase/config';

export const followUser = async (followingId: string): Promise<'followed' | 'already-following'> => {
    const { auth, db } = requireFirebase();
    const followerId = auth.currentUser?.uid;
    if (!followerId) throw new Error('Inicia sesión para seguir usuarios.');
    if (followingId === followerId) throw new Error('No puedes seguirte a ti mismo.');
    return runTransaction(db, async (transaction) => {
        const ref = doc(db, 'follows', followerId, 'followEdges', followingId);
        const [relationship, target] = await Promise.all([
            transaction.get(ref), transaction.get(doc(db, 'users', followingId)),
        ]);
        if (relationship.exists()) return 'already-following';
        if (!target.exists()) throw new Error('El usuario ya no está disponible.');
        transaction.set(ref, { followerId, followingId, createdAt: serverTimestamp() });
        return 'followed';
    });
};
