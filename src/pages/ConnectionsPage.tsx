import { useAuth } from '../auth/hooks/useAuth';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeading } from '../components/common/PageHeading';
import { Pagination } from '../components/common/Pagination';
import { UserCard } from '../components/users/UserCard';
import { getFollowers, getFollowingUsers } from '../data/socialQueries';
import { useSocialData } from '../data/useSocialData';
import { QueryStatus } from '../components/common/QueryStatus';
import { usePagination } from '../hooks/usePagination';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useUserConnections } from '../hooks/useUserConnections';
import { getUserTweetsPath } from '../routes/paths';

export const ConnectionsPage = ({ mode }: { mode: 'following' | 'followers' }) => {
    const { authState } = useAuth();
    const { userId } = useParams();
    const location = useLocation();
    const { users, loading: profilesLoading, error: profilesError } = useSocialData();
    const ownerId = userId ?? authState.user?.uid;
    const owner = users.find((user) => user.uid === ownerId);
    const { relationships, loading: connectionsLoading, error: connectionsError } = useUserConnections(owner?.uid, mode);
    const loading = profilesLoading || connectionsLoading;
    const error = profilesError || connectionsError;
    const query = mode === 'following' ? getFollowingUsers : getFollowers;
    const connections = query(users, relationships, ownerId ?? '');
    const pagination = usePagination(connections);
    const title = mode === 'following' ? 'Seguidos' : 'Seguidores';

    if (loading || error) return <><PageHeading title={title} subtitle="Tu comunidad" /><QueryStatus loading={loading} error={error} /></>;

    if (!owner) return <><PageHeading title={title} subtitle="Tu comunidad" /><EmptyState title="Usuario no encontrado" description="Este perfil no está disponible en la comunidad." /></>;
    const ownList = owner.uid === authState.user?.uid;

    return (
        <>
            <PageHeading title={title} subtitle={`${owner.fullName} (@${owner.username}) · ${connections.length} personas · A–Z`} />
            <Link className="align-self-start m-3 text-break" to={getUserTweetsPath(owner.username)}>Ver perfil de @{owner.username}</Link>
            {connections.length ? (
                <ol className="list-group list-group-flush" aria-label={title}>
                    {pagination.items.map((user) => <li className="list-group-item p-0" key={user.uid}><UserCard user={user} returnTo={location.pathname + location.search} /></li>)}
                </ol>
            ) : (
                <EmptyState title={ownList ? 'Tu comunidad está por crecer' : mode === 'following' ? 'Todavía no sigue a nadie' : 'Todavía no tiene seguidores'}
                    description={ownList ? 'Las personas de tu comunidad aparecerán aquí.' : `Las conexiones de ${owner.fullName} aparecerán aquí.`} />
            )}
            <Pagination {...pagination} />
        </>
    );
};
