import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { PageHeading } from '../components/common/PageHeading';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/Avatar';
import { FollowButton } from '../components/users/FollowButton';
import { UserStats } from '../components/users/UserStats';
import { TweetList } from '../components/tweets/TweetList';
import { useSocialData } from '../data/useSocialData';
import { useTweets } from '../hooks/useTweets';
import { normalizeUsername } from '../services/validation';
import { QueryStatus } from '../components/common/QueryStatus';
import { paths } from '../routes/paths';

export const UserTweetsPage = () => {
    const { username } = useParams();
    const { authState } = useAuth();
    const { users, loading, error } = useSocialData();
    const user = users.find((item) => item.username === normalizeUsername(username || ''));
    const result = useTweets(user ? [user.uid] : []);

    if (loading || error) return <QueryStatus loading={loading} error={error} />;

    if (!user) {
        return (
            <>
                <PageHeading title="Perfil" subtitle="Tu comunidad" />
                <EmptyState title="Usuario no encontrado" description="Este perfil no está disponible en la comunidad." />
                <Link className="btn btn-outline-light align-self-center mb-4" to={paths.home}>Volver a Inicio</Link>
            </>
        );
    }

    return (
        <>
            <PageHeading title="Perfil" subtitle={result.loading ? 'Cargando publicaciones…' : `${result.pagination.totalItems} publicaciones`} />
            <section className="profile-details p-3" aria-label={`Perfil de ${user.fullName}`}>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                    <Avatar user={user} large />
                    <FollowButton key={user.uid} userId={user.uid} />
                </div>
                <h2 className="h4 text-break mb-1">{user.fullName}</h2>
                <p className="text-body-secondary text-break mb-0">@{user.username}</p>
                <UserStats userId={user.uid} />
            </section>
            {user.uid === authState.user?.uid && <Link className="align-self-start m-3 mt-0" to={paths.profileSettings}>Cambiar nombre de usuario</Link>}
            <h2 className="h6 p-3 mb-0 border-top border-bottom bg-body-tertiary">Publicaciones</h2>
            <TweetList {...result} />
        </>
    );
};
