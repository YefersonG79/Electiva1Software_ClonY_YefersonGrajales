import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { requireFirebase } from '../firebase/config';

export const followUser = async (followingId: string): Promise<'followed' | 'already-following'> => {
    const { auth, db } = requireFirebase();
    const followerId = auth.currentUser?.uid;
    if (!followerId) throw new Error('Inicia sesión para seguir usuarios.');
    if (followingId === followerId) throw new Error('No puedes seguirte a ti mismo.');
    const ref = doc(db, 'follows', followerId, 'followEdges', followingId);
    return runTransaction<'followed' | 'already-following'>(db, async (transaction) => {
        const [relationship, target] = await Promise.all([
            transaction.get(ref), transaction.get(doc(db, 'users', followingId)),
        ]);
        if (relationship.exists()) return 'already-following';
        if (!target.exists()) throw new Error('El usuario ya no está disponible.');
        transaction.set(ref, { followerId, followingId, createdAt: serverTimestamp() });
        return 'followed';
    }).catch(async (error: unknown) => {
        // Rules may reject a stale concurrent write before the SDK retries it.
        if (typeof error === 'object' && error && 'code' in error
            && (error.code === 'permission-denied' || error.code === 'aborted')) {
            try {
                const existing = await getDocFromServer(ref);
                if (auth.currentUser?.uid === followerId && existing.exists()
                    && existing.data().followerId === followerId && existing.data().followingId === followingId) return 'already-following' as const;
            } catch { /* Preserve the original error if the confirmation also fails. */ }
        }
        throw error;
    });
};

export const unfollowUser = async (followingId: string): Promise<'unfollowed' | 'already-not-following'> => {
    const { auth, db } = requireFirebase();
    const followerId = auth.currentUser?.uid;
    if (!followerId) throw new Error('Inicia sesión para dejar de seguir usuarios.');
    if (followingId === followerId) throw new Error('No puedes modificar una relación contigo mismo.');
    const ref = doc(db, 'follows', followerId, 'followEdges', followingId);
    return runTransaction<'unfollowed' | 'already-not-following'>(db, async (transaction) => {
        if (!(await transaction.get(ref)).exists()) return 'already-not-following';
        transaction.delete(ref);
        return 'unfollowed';
    }).catch(async (error: unknown) => {
        // A concurrent removal may reach the desired state before this commit.
        if (typeof error === 'object' && error && 'code' in error
            && (error.code === 'permission-denied' || error.code === 'aborted')) {
            try {
                const existing = await getDocFromServer(ref);
                if (auth.currentUser?.uid === followerId && !existing.exists()) return 'already-not-following' as const;
            } catch { /* Keep the original failure when its result cannot be confirmed. */ }
        }
        throw error;
    });
};
