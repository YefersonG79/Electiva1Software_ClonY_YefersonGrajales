import type { Tweet } from '../../data/types';
import { usePagination } from '../../hooks/usePagination';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { TweetCard } from './TweetCard';
import { QueryStatus } from '../common/QueryStatus';

export const TweetList = ({ tweets, loading = false, error = null, pagination: remotePagination }: {
    tweets: Tweet[]; loading?: boolean; error?: string | null;
    pagination?: { currentPage: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void };
}) => {
    const localPagination = usePagination(tweets);
    const pagination = remotePagination || localPagination;
    const items = remotePagination ? tweets : localPagination.items;

    if (loading || error) return <QueryStatus loading={loading} error={error} />;

    if (!tweets.length) {
        return <EmptyState title="La conversación empieza aquí" description="Las publicaciones aparecerán en este espacio." />;
    }

    return (
        <>
            <ol className="list-group list-group-flush" aria-label="Publicaciones">
                {items.map((tweet) => <li className="list-group-item p-0" key={tweet.id}><TweetCard tweet={tweet} /></li>)}
            </ol>
            <Pagination {...pagination} />
        </>
    );
};
