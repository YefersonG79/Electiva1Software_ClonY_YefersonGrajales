import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    collection, documentId, getCountFromServer, limit, orderBy, query, Timestamp, where,
} from 'firebase/firestore';
import type { Tweet } from '../data/types';
import { requireFirebase } from '../firebase/config';
import { errorMessage, reportFirestoreError } from '../services/errors';
import { subscribeToQuery } from '../services/firestoreQueries';
import { PAGE_SIZE } from '../utils/pagination';

interface TweetResult { key: string; tweets: Tweet[]; totalItems: number; currentPage: number; error: string | null }
interface TimedTweet extends Tweet { orderTimestamp: Timestamp }

export const useTweets = (authorIds: string[]) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawPage = Number(searchParams.get('page') || 1);
    const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const authorsKey = JSON.stringify([...new Set(authorIds)].sort());
    const key = `${authorsKey}:${requestedPage}`;
    const [state, setState] = useState<TweetResult>({ key: '', tweets: [], totalItems: 0, currentPage: 1, error: null });

    useEffect(() => {
        let active = true;
        const stops: (() => void)[] = [];
        const authors: string[] = JSON.parse(authorsKey);
        const { db } = requireFirebase();
        const fail = (error: unknown) => {
            if (active) setState({ key, tweets: [], totalItems: 0, currentPage: 1, error: errorMessage(error) });
        };
        const start = async () => {
            const chunks = Array.from({ length: Math.ceil(authors.length / 30) }, (_, i) => authors.slice(i * 30, (i + 1) * 30));
            const queries = chunks.map((chunk) => query(collection(db, 'tweets'), where('authorId', 'in', chunk)));
            const counts = await Promise.all(queries.map(async (q) => (await getCountFromServer(q)).data().count));
            if (!active) return;
            const page = Math.min(requestedPage, Math.max(1, Math.ceil(counts.reduce((a, b) => a + b, 0) / PAGE_SIZE)));
            const results: (TimedTweet[] | undefined)[] = queries.map(() => undefined);
            const versions = queries.map(() => 0);
            const errors = queries.map(() => false);
            const update = () => {
                if (!active || errors.some(Boolean) || results.some((result) => result === undefined)) return;
                const totalItems = counts.reduce((a, b) => a + b, 0);
                const tweets = results.flatMap((result) => result || []).sort((a, b) =>
                    b.orderTimestamp.seconds - a.orderTimestamp.seconds
                    || b.orderTimestamp.nanoseconds - a.orderTimestamp.nanoseconds
                    || (a.id === b.id ? 0 : a.id < b.id ? 1 : -1));
                setState({ key, tweets: tweets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), totalItems, currentPage: page, error: null });
            };
            if (!queries.length) update();
            queries.forEach((q, index) => {
                // Each author chunk contributes its newest N candidates to the merged feed.
                stops.push(subscribeToQuery(query(q, orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'), limit(page * PAGE_SIZE)),
                    'tweets: authorId IN autores, createdAt DESC, __name__ DESC (feed/perfil)', async (snapshot) => {
                        if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
                        const version = ++versions[index];
                        const count = await getCountFromServer(q);
                        if (!active || version !== versions[index]) return;
                        counts[index] = count.data().count;
                        errors[index] = false;
                        results[index] = snapshot.docs.flatMap((item) => {
                            const data = item.data();
                            return data.createdAt instanceof Timestamp
                                ? [{ ...data, id: item.id, createdAt: data.createdAt.toDate().toISOString(), orderTimestamp: data.createdAt } as TimedTweet] : [];
                        });
                        update();
                    }, (error) => { errors[index] = true; fail(error); }, { includeMetadataChanges: true }));
            });
        };
        void start().catch((error) => {
            reportFirestoreError('tweets: recuento authorId IN autores', error);
            fail(error);
        });
        return () => { active = false; stops.forEach((stop) => stop()); };
    }, [authorsKey, requestedPage, key]);

    const loading = state.key !== key;
    const totalItems = loading ? 0 : state.totalItems;
    return {
        tweets: loading ? [] : state.tweets, loading, error: loading ? null : state.error,
        pagination: {
            currentPage: loading ? 1 : state.currentPage,
            totalPages: Math.max(1, Math.ceil(totalItems / PAGE_SIZE)), totalItems,
            onPageChange: (page: number) => setSearchParams({ page: String(page) }),
        },
    };
};
