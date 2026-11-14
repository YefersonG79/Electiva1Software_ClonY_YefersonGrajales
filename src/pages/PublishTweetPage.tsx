import { useNavigate } from 'react-router-dom';
import { PageHeading } from '../components/common/PageHeading';
import { TweetForm } from '../components/tweets/TweetForm';
import { publishTweet } from '../services/tweets';
import { paths } from '../routes/paths';

export const PublishTweetPage = () => {
    const navigate = useNavigate();

    const onPublish = async (content: string) => {
        await publishTweet(content);
        navigate(paths.feed, { state: { published: true } });
    };

    return (
        <>
            <PageHeading title="Publicar un tweet" subtitle="Tu próxima conversación" />
            <TweetForm onPublish={onPublish} />
        </>
    );
};
