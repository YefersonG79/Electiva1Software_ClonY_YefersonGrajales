import { Link } from 'react-router-dom';
import { useMockData } from '../../data/useMockData';
import type { Tweet } from '../../data/types';
import { getUserTweetsPath } from '../../routes/paths';
import { Avatar } from '../common/Avatar';

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota',
});

export const TweetCard = ({ tweet }: { tweet: Tweet }) => {
    const { users } = useMockData();
    const author = users.find((user) => user.uid === tweet.authorId);
    if (!author) return null;

    return (
        <article className="tweet-card d-flex gap-3 p-3">
            <Link className="flex-shrink-0" to={getUserTweetsPath(author.username)} aria-label={`Ver perfil de ${author.fullName}`}>
                <Avatar user={author} />
            </Link>
            <div className="flex-grow-1 min-w-0">
                <div className="d-flex flex-wrap align-items-baseline gap-1 small">
                    <Link className="tweet-author text-body text-decoration-none text-break" to={getUserTweetsPath(author.username)}>
                        <strong>{author.fullName}</strong> <span className="text-body-secondary">@{author.username}</span>
                    </Link>
                    <span className="text-body-secondary" aria-hidden="true">·</span>
                    <time className="text-body-secondary" dateTime={tweet.createdAt}>{dateFormatter.format(new Date(tweet.createdAt))}</time>
                </div>
                <p className="tweet-body mt-2 mb-0">{tweet.content}</p>
            </div>
        </article>
    );
};
