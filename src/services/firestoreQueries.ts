import { onSnapshot, type DocumentData, type Query, type QuerySnapshot, type SnapshotListenOptions } from 'firebase/firestore';
import { reportFirestoreError } from './errors';

// Snapshot errors terminate the listener. Reattach transiently failed queries so an
// index finishing its build can recover without leaving a stale error on screen.
export const subscribeToQuery = <T extends DocumentData>(
    source: Query<T>, context: string, next: (snapshot: QuerySnapshot<T>) => void | Promise<void>,
    fail: (error: unknown) => void, options: SnapshotListenOptions = {},
) => {
    let active = true;
    let generation = 0;
    let attempts = 0;
    let awaitingRecovery = false;
    let stop = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
        if (!active) return;
        const current = ++generation;
        const reject = (error: unknown) => {
            if (!active || current !== generation) return;
            ++generation;
            awaitingRecovery = true;
            stop();
            reportFirestoreError(context, error);
            fail(error);
            const code = typeof error === 'object' && error && 'code' in error ? error.code : '';
            if (code === 'failed-precondition' || code === 'unavailable') {
                timer = setTimeout(start, Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)));
            }
        };
        stop = onSnapshot(source, { ...options, includeMetadataChanges: true }, (snapshot) => {
            if (!active || current !== generation) return;
            if (awaitingRecovery && (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)) return;
            void Promise.resolve().then(() => {
                if (active && current === generation) return next(snapshot);
            }).then(() => {
                if (active && current === generation && !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
                    attempts = 0;
                    awaitingRecovery = false;
                }
            }).catch(reject);
        }, reject);
    };
    start();
    return () => { active = false; ++generation; stop(); clearTimeout(timer); };
};
