import { useNavigate } from 'react-router-dom';
import { PageHeading } from '../components/common/PageHeading';
import { TweetForm } from '../components/tweets/TweetForm';
import { useMockData } from '../data/useMockData';
import { paths } from '../routes/paths';

export const PublishTweetPage = () => {
    const { publishTweet } = useMockData();
    const navigate = useNavigate();

    const onPublish = (content: string) => {
        publishTweet(content);
        navigate(paths.feed, { state: { published: true } });
    };

    return (
        <>
            <PageHeading title="Publicar un tweet" subtitle="Tu próxima conversación" />
            <TweetForm onPublish={onPublish} />
        </>
    );
};
