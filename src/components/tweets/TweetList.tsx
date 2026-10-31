import type { Tweet } from '../../data/types';
import { usePagination } from '../../hooks/usePagination';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { TweetCard } from './TweetCard';

export const TweetList = ({ tweets }: { tweets: Tweet[] }) => {
    const pagination = usePagination(tweets);

    if (!tweets.length) {
        return <EmptyState title="La conversación empieza aquí" description="Las publicaciones aparecerán en este espacio." />;
    }

    return (
        <>
            <ol className="list-group list-group-flush" aria-label="Publicaciones">
                {pagination.items.map((tweet) => <li className="list-group-item p-0" key={tweet.id}><TweetCard tweet={tweet} /></li>)}
            </ol>
            <Pagination {...pagination} />
        </>
    );
};
