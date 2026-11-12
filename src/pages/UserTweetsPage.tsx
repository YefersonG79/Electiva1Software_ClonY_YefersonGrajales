import { Link, useParams } from 'react-router-dom';
import { PageHeading } from '../components/common/PageHeading';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/Avatar';
import { FollowButton } from '../components/users/FollowButton';
import { UserStats } from '../components/users/UserStats';
import { TweetList } from '../components/tweets/TweetList';
import { useMockData } from '../data/useMockData';
import { sortTweetsByDate } from '../data/socialQueries';
import { paths } from '../routes/paths';

export const UserTweetsPage = () => {
    const { username } = useParams();
    const { users, tweets } = useMockData();
    const user = users.find((item) => item.username === username);

    if (!user) {
        return (
            <>
                <PageHeading title="Perfil" subtitle="Tu comunidad" />
                <EmptyState title="Usuario no encontrado" description="Este perfil no está disponible en la comunidad de demostración." />
                <Link className="btn btn-outline-light align-self-center mb-4" to={paths.home}>Volver a Inicio</Link>
            </>
        );
    }

    const userTweets = sortTweetsByDate(tweets.filter((tweet) => tweet.authorId === user.uid));

    return (
        <>
            <PageHeading title="Perfil" subtitle={`${userTweets.length} publicaciones`} />
            <section className="profile-details p-3" aria-label={`Perfil de ${user.fullName}`}>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                    <Avatar user={user} large />
                    <FollowButton userId={user.uid} />
                </div>
                <h2 className="h4 text-break mb-1">{user.fullName}</h2>
                <p className="text-body-secondary text-break mb-0">@{user.username}</p>
                <UserStats userId={user.uid} />
            </section>
            <h2 className="h6 p-3 mb-0 border-top border-bottom bg-body-tertiary">Publicaciones</h2>
            <TweetList tweets={userTweets} />
        </>
    );
};
