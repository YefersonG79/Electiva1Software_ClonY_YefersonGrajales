import { useAuth } from '../../auth/hooks/useAuth';
import { useSocialData } from '../../data/useSocialData';
import { useRef, useState } from 'react';
import { followUser, unfollowUser } from '../../services/follows';
import { errorMessage, reportFirestoreError } from '../../services/errors';

export const FollowButton = ({ userId }: { userId: string }) => {
    const { authState } = useAuth();
    const { relationships, loading, error: relationshipError } = useSocialData();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const inFlight = useRef(false);
    if (!authState.user || userId === authState.user.uid) return null;
    const isFollowing = relationships.some((item) =>
        item.followerId === authState.user?.uid && item.followingId === userId,
    );

    const toggleFollow = async () => {
        if (inFlight.current || loading || relationshipError) return;
        inFlight.current = true;
        setPending(true);
        setError('');
        try {
            if (isFollowing) await unfollowUser(userId);
            else await followUser(userId);
        } catch (failure) {
            reportFirestoreError('Cambio de seguimiento', failure);
            setError(errorMessage(failure));
        } finally { inFlight.current = false; setPending(false); }
    };

    return (
        <div className="text-end">
            <button className={`btn btn-sm flex-shrink-0 ${isFollowing ? 'btn-outline-light' : 'btn-primary'}`}
                disabled={pending || loading || !!relationshipError} onClick={toggleFollow}
                aria-pressed={isFollowing} aria-busy={pending} title={isFollowing ? 'Dejar de seguir' : 'Seguir'}>
                {pending ? 'Guardando…' : isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
            {(error || relationshipError) && <p className="small text-danger mb-0 mt-1" role="alert">{error || relationshipError}</p>}
        </div>
    );
};
