import { useAuth } from '../../auth/hooks/useAuth';
import { useMockData } from '../../data/useMockData';

export const FollowButton = ({ userId }: { userId: string }) => {
    const { authState } = useAuth();
    const { relationships, followUser } = useMockData();
    if (!authState.user || userId === authState.user.uid) return null;
    const isFollowing = relationships.some((item) =>
        item.followerId === authState.user?.uid && item.followingId === userId,
    );

    return (
        <button className={`btn btn-sm flex-shrink-0 ${isFollowing ? 'btn-outline-light' : 'btn-primary'}`}
            disabled={isFollowing} onClick={() => followUser(userId)}>
            {isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
    );
};
