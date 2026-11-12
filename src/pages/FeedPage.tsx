import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { PageHeading } from '../components/common/PageHeading';
import { TweetList } from '../components/tweets/TweetList';
import { getFeedTweets } from '../data/socialQueries';
import { useMockData } from '../data/useMockData';

export const FeedPage = () => {
    const { authState } = useAuth();
    const { tweets, relationships } = useMockData();
    const location = useLocation();
    const feedTweets = getFeedTweets(tweets, relationships, authState.user?.uid ?? '');

    return (
        <>
            <PageHeading title="Tu feed" subtitle="Tú y las personas que sigues" />
            {location.state?.published && (
                <p className="alert alert-success m-3 small" role="status">Tu tweet se publicó en esta sesión de demostración.</p>
            )}
            <TweetList tweets={feedTweets} />
        </>
    );
};
