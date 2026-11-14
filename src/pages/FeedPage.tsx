import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { PageHeading } from '../components/common/PageHeading';
import { TweetList } from '../components/tweets/TweetList';
import { useSocialData } from '../data/useSocialData';
import { useTweets } from '../hooks/useTweets';

export const FeedPage = () => {
    const { authState } = useAuth();
    const { relationships, loading, error } = useSocialData();
    const location = useLocation();
    const uid = authState.user?.uid || '';
    const result = useTweets([uid, ...relationships.filter((edge) => edge.followerId === uid).map((edge) => edge.followingId)]);

    return (
        <>
            <PageHeading title="Tu feed" subtitle="Tú y las personas que sigues" />
            {location.state?.published && (
                <p className="alert alert-success m-3 small" role="status">Tu tweet se publicó correctamente.</p>
            )}
            <TweetList {...result} loading={loading || result.loading} error={error || result.error} />
        </>
    );
};
