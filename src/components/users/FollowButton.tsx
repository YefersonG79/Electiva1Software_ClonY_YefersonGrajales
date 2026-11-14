import { useAuth } from '../../auth/hooks/useAuth';
import { useSocialData } from '../../data/useSocialData';
import { useState } from 'react';
import { followUser } from '../../services/follows';
import { errorMessage } from '../../services/errors';

export const FollowButton = ({ userId }: { userId: string }) => {
    const { authState } = useAuth();
    const { relationships, loading } = useSocialData();
    const [pending, setPending] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [followedId, setFollowedId] = useState('');
    if (!authState.user || userId === authState.user.uid) return null;
    const isFollowing = followedId === userId || relationships.some((item) =>
        item.followerId === authState.user?.uid && item.followingId === userId,
    );

    const follow = async () => {
        if (pending) return;
        setPending(true);
        setError('');
        setNotice('');
        try {
            const result = await followUser(userId);
            setFollowedId(userId);
            setNotice(result === 'already-following' ? 'Ya sigues a este usuario.' : 'Ahora sigues a este usuario.');
        } catch (failure) { setError(errorMessage(failure)); }
        finally { setPending(false); }
    };

    return (
        <div className="text-end">
            <button className={`btn btn-sm flex-shrink-0 ${isFollowing ? 'btn-outline-light' : 'btn-primary'}`}
                disabled={isFollowing || pending || loading} onClick={follow}>
                {pending ? 'Siguiendo…' : isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
            {notice && <p className="small text-success mb-0 mt-1" role="status">{notice}</p>}
            {isFollowing && !notice && <p className="small text-body-secondary mb-0 mt-1">Ya sigues a este usuario.</p>}
            {error && <p className="small text-danger mb-0 mt-1" role="alert">{error}</p>}
        </div>
    );
};
