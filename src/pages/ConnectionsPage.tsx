import { useAuth } from '../auth/hooks/useAuth';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeading } from '../components/common/PageHeading';
import { Pagination } from '../components/common/Pagination';
import { UserCard } from '../components/users/UserCard';
import { getFollowers, getFollowingUsers } from '../data/socialQueries';
import { useMockData } from '../data/useMockData';
import { usePagination } from '../hooks/usePagination';

export const ConnectionsPage = ({ mode }: { mode: 'following' | 'followers' }) => {
    const { authState } = useAuth();
    const { users, relationships } = useMockData();
    const query = mode === 'following' ? getFollowingUsers : getFollowers;
    const connections = query(users, relationships, authState.user?.uid ?? '');
    const pagination = usePagination(connections);
    const title = mode === 'following' ? 'Seguidos' : 'Seguidores';

    return (
        <>
            <PageHeading title={title} subtitle={`${connections.length} personas · A–Z`} />
            {connections.length ? (
                <ol className="list-group list-group-flush" aria-label={title}>
                    {pagination.items.map((user) => <li className="list-group-item p-0" key={user.uid}><UserCard user={user} /></li>)}
                </ol>
            ) : (
                <EmptyState title="Tu comunidad está por crecer" description="Las personas de tu comunidad aparecerán aquí." />
            )}
            <Pagination {...pagination} />
        </>
    );
};
