import { Link } from 'react-router-dom';
import type { User } from '../../auth/types/AuthReducerInterfaces';
import { getUserTweetsPath } from '../../routes/paths';
import { Avatar } from '../common/Avatar';
import { FollowButton } from './FollowButton';

export const UserCard = ({ user }: { user: User }) => (
    <article className="user-card d-flex align-items-center justify-content-between gap-3 p-3">
        <Link className="d-flex align-items-center gap-2 min-w-0 text-body text-decoration-none" to={getUserTweetsPath(user.username)}>
            <Avatar user={user} />
            <span className="min-w-0 text-break"><strong className="d-block">{user.fullName}</strong><span className="text-body-secondary small">@{user.username}</span></span>
        </Link>
        <FollowButton userId={user.uid} />
    </article>
);
