import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import {
    connectAuthEmulator, createUserWithEmailAndPassword, getAuth, GoogleAuthProvider,
    signInWithCredential, signInWithCustomToken, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
    collection, collectionGroup, connectFirestoreEmulator, doc, getCountFromServer,
    deleteDoc, documentId, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, runTransaction,
    serverTimestamp, setDoc, setLogLevel, Timestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run this suite through npm run test:emulators.');
const projectId = 'demo-clon-y';
const clients = [];
const completed = [];
setLogLevel('silent');

const check = async (name, run) => {
    await run();
    completed.push(name);
    console.log(`PASS ${name}`);
};

export function client() {
    const app = initializeApp({ projectId, apiKey: 'demo-key', appId: 'demo-app' }, `test-${clients.length}`);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    const value = { app, auth, db, functions };
    clients.push(value);
    return value;
}

export async function account(value, label) {
    return (await createUserWithEmailAndPassword(value.auth, `${label}@example.test`, 'Test-password-123')).user;
}

export async function reserve(value, identity, username) {
    return runTransaction(value.db, async (transaction) => {
        const name = doc(value.db, 'usernames', username);
        if ((await transaction.get(name)).exists()) throw new Error('Username taken');
        const createdAt = serverTimestamp();
        transaction.set(name, { uid: identity.uid, createdAt });
        transaction.set(doc(value.db, 'users', identity.uid), {
            uid: identity.uid, username, fullName: username, photoURL: null, createdAt,
        });
        transaction.set(doc(value.db, 'privateUsers', identity.uid), { uid: identity.uid, email: identity.email, createdAt });
    });
}

export async function rejected(promise) {
    await assert.rejects(promise, (error) => error.code === 'permission-denied');
}

// Exercise the multi-document security contract independently of the browser service.
export async function rename(value, username) {
    const uid = value.auth.currentUser.uid;
    return runTransaction(value.db, async (transaction) => {
        const profileRef = doc(value.db, 'users', uid);
        const profile = await transaction.get(profileRef);
        const previous = profile.data().username;
        if (previous === username) return;
        const nameRef = doc(value.db, 'usernames', username);
        if ((await transaction.get(nameRef)).exists()) throw new Error('Username taken');
        transaction.set(nameRef, { uid, createdAt: serverTimestamp() });
        transaction.update(profileRef, { username });
        transaction.delete(doc(value.db, 'usernames', previous));
    });
}

function renameBatch(value, uid, previous, username, { release = true, reserveName = true, extra = {} } = {}) {
    const batch = writeBatch(value.db);
    if (reserveName) batch.set(doc(value.db, 'usernames', username), { uid, createdAt: serverTimestamp() });
    batch.update(doc(value.db, 'users', uid), { username, ...extra });
    if (release) batch.delete(doc(value.db, 'usernames', previous));
    return batch.commit();
}

function tweet(value, uid, content, extra = {}) {
    const ref = doc(collection(value.db, 'tweets'));
    return setDoc(ref, { id: ref.id, authorId: uid, content, createdAt: serverTimestamp(), ...extra });
}

export async function follow(value, followerId, followingId) {
    return runTransaction(value.db, async (transaction) => {
        const ref = doc(value.db, 'follows', followerId, 'followEdges', followingId);
        if ((await transaction.get(ref)).exists()) return false;
        transaction.set(ref, { followerId, followingId, createdAt: serverTimestamp() });
        return true;
    });
}

export async function runIntegration() {
    for (const endpoint of [
        'http://127.0.0.1:9099/emulator/v1/projects/demo-clon-y/accounts',
        'http://127.0.0.1:8080/emulator/v1/projects/demo-clon-y/databases/(default)/documents',
    ]) assert.ok((await fetch(endpoint, { method: 'DELETE' })).ok, 'Reset only the isolated demo project');
    const a = client();
    const b = client();
    const guest = client();
    try {
        const alice = await account(a, 'alice');
        const bob = await account(b, 'bob');
        await check('atomic registration stores UID profile, private email and reservation', async () => {
            await reserve(a, alice, 'alice');
            await reserve(b, bob, 'bob');
            assert.equal((await getDoc(doc(a.db, 'users', alice.uid))).data().username, 'alice');
            assert.equal((await getDoc(doc(a.db, 'usernames', 'alice'))).data().uid, alice.uid);
        });
        await check('duplicate email is rejected by Authentication', async () => {
            await assert.rejects(account(guest, 'alice'), (error) => error.code === 'auth/email-already-in-use');
        });
        await check('username reservation survives simultaneous requests with one winner', async () => {
            const c = client();
            const d = client();
            const [one, two] = await Promise.all([account(c, 'race-one'), account(d, 'race-two')]);
            const outcomes = await Promise.allSettled([reserve(c, one, 'shared_name'), reserve(d, two, 'shared_name')]);
            assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
            assert.equal(outcomes.filter((result) => result.status === 'rejected').length, 1);
            const winner = (await getDoc(doc(a.db, 'usernames', 'shared_name'))).data().uid;
            assert.ok([one.uid, two.uid].includes(winner));
        });
        await check('private emails and unauthenticated reads are denied', async () => {
            await rejected(getDoc(doc(b.db, 'privateUsers', alice.uid)));
            await rejected(getDoc(doc(guest.db, 'users', alice.uid)));
            await rejected(getDoc(doc(guest.db, 'usernames', 'alice')));
            await rejected(getDocs(collection(a.db, 'privateUsers')));
            assert.equal('email' in (await getDoc(doc(b.db, 'users', alice.uid))).data(), false);
        });
        await check('reservation theft, orphan reservations and profile impersonation are denied', async () => {
            await rejected(setDoc(doc(b.db, 'usernames', 'alice'), { uid: bob.uid, createdAt: serverTimestamp() }));
            await rejected(setDoc(doc(b.db, 'usernames', 'orphan'), { uid: bob.uid, createdAt: serverTimestamp() }));
            await rejected(updateDoc(doc(b.db, 'users', alice.uid), { fullName: 'Impostor' }));
            await rejected(updateDoc(doc(a.db, 'users', alice.uid), { username: 'stolen' }));
            await rejected(updateDoc(doc(a.db, 'users', alice.uid), { email: 'public@example.test' }));
            await updateDoc(doc(a.db, 'users', alice.uid), { fullName: 'Alice Example' });
        });
        await check('valid server-dated multiline and 280-character tweets are accepted', async () => {
            await tweet(a, alice.uid, 'First line\nSecond line');
            await tweet(a, alice.uid, 'x'.repeat(280));
            await tweet(a, alice.uid, '😀'.repeat(280));
        });
        await check('empty, whitespace, over-limit, forged-author and client-dated tweets are denied', async () => {
            for (const content of ['', '  \n\t ', 'x'.repeat(281), '😀'.repeat(281)]) await rejected(tweet(a, alice.uid, content));
            await rejected(tweet(b, alice.uid, 'Forged author'));
            await rejected(tweet(a, alice.uid, 'Client date', { createdAt: Timestamp.fromMillis(0) }));
        });
        await check('tweets are newest-first and query pages contain at most ten', async () => {
            const batch = writeBatch(a.db);
            for (let i = 0; i < 12; i += 1) {
                const ref = doc(collection(a.db, 'tweets'));
                batch.set(ref, { id: ref.id, authorId: alice.uid, content: `Pagination ${i}`, createdAt: serverTimestamp() });
            }
            await batch.commit();
            const snapshot = await getDocs(query(collection(a.db, 'tweets'), where('authorId', 'in', [alice.uid]), orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'), limit(10)));
            assert.equal(snapshot.size, 10);
            const times = snapshot.docs.map((item) => item.data().createdAt.toMillis());
            assert.ok(times.every((time, i) => i === 0 || time <= times[i - 1]));
        });
        await check('following is idempotent under simultaneous requests', async () => {
            const result = await Promise.all([follow(a, alice.uid, bob.uid), follow(a, alice.uid, bob.uid)]);
            assert.deepEqual(result.sort(), [false, true]);
            const outgoing = query(collectionGroup(a.db, 'followEdges'), where('followerId', '==', alice.uid));
            assert.equal((await getCountFromServer(outgoing)).data().count, 1);
        });
        await check('self-following, forged follower and relationship mutation are denied', async () => {
            await rejected(follow(a, alice.uid, alice.uid));
            await rejected(follow(b, alice.uid, bob.uid + '-missing'));
            await rejected(updateDoc(doc(a.db, 'follows', alice.uid, 'followEdges', bob.uid), { followerId: bob.uid }));
        });
        await check('follower counter listener updates after relationship creation', async () => {
            const counts = [];
            let stop = () => {};
            try {
                await new Promise((resolve, reject) => {
                    const timer = setTimeout(() => reject(new Error('Live counter timed out')), 10000);
                    stop = onSnapshot(query(collectionGroup(a.db, 'followEdges'), where('followingId', '==', alice.uid)), (snapshot) => {
                        counts.push(snapshot.size);
                        if (snapshot.size === 1) { clearTimeout(timer); resolve(); }
                    }, reject);
                    void follow(b, bob.uid, alice.uid).catch(reject);
                });
                assert.equal(counts.at(-1), 1);
            } finally { stop(); }
        });
        await check('callable username login and sign-out use real emulator Authentication', async () => {
            await signOut(a.auth);
            const signIn = httpsCallable(a.functions, 'signInWithUsername');
            const { data } = await signIn({ username: '@ALICE', password: 'Test-password-123' });
            assert.deepEqual(Object.keys(data), ['token']);
            const credential = await signInWithCustomToken(a.auth, data.token);
            assert.equal(credential.user.uid, alice.uid);
            await signOut(a.auth);
            assert.equal(a.auth.currentUser, null);
        });
        await check('invalid password and unknown username return the same generic login error', async () => {
            const signIn = httpsCallable(a.functions, 'signInWithUsername');
            for (const username of ['alice', 'unknown_user']) {
                await assert.rejects(signIn({ username, password: 'wrong-password' }), (error) =>
                    error.code === 'functions/unauthenticated' && !error.message.includes('@example.test'));
            }
        });
        await check('email and password sign-in preserves the UID and existing Firestore profile', async () => {
            const credential = await signInWithEmailAndPassword(a.auth, 'ALICE@example.test', 'Test-password-123');
            assert.ok(credential.user.providerData.some((provider) => provider.providerId === 'password'));
            assert.equal(credential.user.uid, alice.uid);
            assert.equal((await getDoc(doc(a.db, 'users', credential.user.uid))).data().username, 'alice');
            await signOut(a.auth);
        });
        await check('incorrect email passwords, unknown accounts and malformed emails are rejected', async () => {
            for (const email of ['alice@example.test', 'unknown@example.test']) {
                await assert.rejects(signInWithEmailAndPassword(a.auth, email, 'wrong-password'), (error) =>
                    ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error.code));
                assert.equal(a.auth.currentUser, null);
            }
            await assert.rejects(signInWithEmailAndPassword(a.auth, 'invalid-email', 'Test-password-123'),
                (error) => error.code === 'auth/invalid-email');
        });
        await check('Google credential authentication works in the Auth emulator', async () => {
            const identityToken = [
                Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
                Buffer.from(JSON.stringify({ sub: 'google-test-sub', email: 'google@example.test', email_verified: true, name: 'Google Test', aud: projectId, iss: 'https://accounts.google.com' })).toString('base64url'), '',
            ].join('.');
            const result = await signInWithCredential(guest.auth, GoogleAuthProvider.credential(identityToken));
            assert.equal(result.providerId, 'google.com');
            assert.deepEqual(result.user.providerData.map((provider) => provider.providerId), ['google.com']);
        });
        await check('Google-only accounts cannot sign in with an unlinked password provider', async () => {
            const email = guest.auth.currentUser.email;
            await signOut(guest.auth);
            await assert.rejects(signInWithEmailAndPassword(guest.auth, email, 'Test-password-123'), (error) =>
                ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error.code));
            assert.equal(guest.auth.currentUser, null);
        });
        const r1 = client();
        const r2 = client();
        const one = await account(r1, 'rename-one');
        const two = await account(r2, 'rename-two');
        await reserve(r1, one, 'rename_one');
        await reserve(r2, two, 'rename_two');
        await check('atomic rename preserves UID, profile fields, private email, tweets and relationships', async () => {
            const before = (await getDoc(doc(r1.db, 'users', one.uid))).data();
            const privateBefore = (await getDoc(doc(r1.db, 'privateUsers', one.uid))).data();
            await tweet(r1, one.uid, 'Before rename');
            await follow(r1, one.uid, two.uid);
            await rename(r1, 'renamed_one');
            const after = (await getDoc(doc(r1.db, 'users', one.uid))).data();
            assert.deepEqual(after, { ...before, username: 'renamed_one' });
            assert.deepEqual((await getDoc(doc(r1.db, 'privateUsers', one.uid))).data(), privateBefore);
            assert.equal((await getDoc(doc(r1.db, 'usernames', 'renamed_one'))).data().uid, one.uid);
            assert.equal((await getDoc(doc(r1.db, 'usernames', 'rename_one'))).exists(), false);
            assert.equal((await getDocs(query(collection(r1.db, 'tweets'), where('authorId', '==', one.uid)))).size, 1);
            assert.equal((await getDoc(doc(r1.db, 'follows', one.uid, 'followEdges', two.uid))).exists(), true);
            assert.equal(r1.auth.currentUser.uid, one.uid);
        });
        await check('occupied and invalid names leave the profile and both reservations intact', async () => {
            await assert.rejects(rename(r1, 'rename_two'), /Username taken/);
            for (const name of ['ab', 'Invalid', 'with space', 'x'.repeat(31)]) await rejected(rename(r1, name));
            assert.equal((await getDoc(doc(r1.db, 'users', one.uid))).data().username, 'renamed_one');
            assert.equal((await getDoc(doc(r1.db, 'usernames', 'renamed_one'))).data().uid, one.uid);
            assert.equal((await getDoc(doc(r1.db, 'usernames', 'rename_two'))).data().uid, two.uid);
        });
        await check('partial renames, standalone releases and changed immutable fields are rejected atomically', async () => {
            await rejected(deleteDoc(doc(r1.db, 'usernames', 'renamed_one')));
            await rejected(renameBatch(r1, one.uid, 'renamed_one', 'partial_name', { release: false }));
            await rejected(renameBatch(r1, one.uid, 'renamed_one', 'partial_name', { reserveName: false }));
            for (const extra of [{ uid: two.uid }, { createdAt: Timestamp.fromMillis(0) }, { email: 'other@example.test' }, { fullName: 'Changed too' }]) {
                await rejected(renameBatch(r1, one.uid, 'renamed_one', 'partial_name', { extra }));
            }
            assert.equal((await getDoc(doc(r1.db, 'usernames', 'partial_name'))).exists(), false);
            assert.equal((await getDoc(doc(r1.db, 'users', one.uid))).data().username, 'renamed_one');
            assert.equal((await getDoc(doc(r1.db, 'usernames', 'renamed_one'))).exists(), true);
            await rejected(updateDoc(doc(r1.db, 'privateUsers', one.uid), { email: 'other@example.test' }));
        });
        await check('other users and signed-out clients cannot rename a profile or release its reservation', async () => {
            await rejected(renameBatch(r2, one.uid, 'renamed_one', 'stolen_name'));
            await rejected(deleteDoc(doc(r2.db, 'usernames', 'renamed_one')));
            const anonymous = client();
            await rejected(renameBatch(anonymous, one.uid, 'renamed_one', 'stolen_name'));
            assert.equal((await getDoc(doc(r1.db, 'usernames', 'stolen_name'))).exists(), false);
        });
        await check('concurrent renames have one winner and retain the losing users original reservation', async () => {
            const results = await Promise.allSettled([rename(r1, 'rename_race'), rename(r2, 'rename_race')]);
            assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
            assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
            const winner = (await getDoc(doc(r1.db, 'usernames', 'rename_race'))).data().uid;
            for (const [identity, original] of [[one, 'renamed_one'], [two, 'rename_two']]) {
                assert.equal((await getDoc(doc(r1.db, 'users', identity.uid))).data().username, identity.uid === winner ? 'rename_race' : original);
                assert.equal((await getDoc(doc(r1.db, 'usernames', original))).exists(), identity.uid !== winner);
            }
        });
        await check('concurrent changes by the same owner leave exactly one reservation; retries are idempotent', async () => {
            const results = await Promise.allSettled([rename(r1, 'same_owner_a'), rename(r1, 'same_owner_b')]);
            assert.ok(results.some((result) => result.status === 'fulfilled'));
            // Rules may reject a stale write before the SDK can retry its precondition.
            for (const result of results) if (result.status === 'rejected') assert.equal(result.reason.code, 'permission-denied');
            const current = (await getDoc(doc(r1.db, 'users', one.uid))).data().username;
            assert.ok(['same_owner_a', 'same_owner_b'].includes(current));
            for (const name of ['same_owner_a', 'same_owner_b', 'renamed_one']) {
                assert.equal((await getDoc(doc(r1.db, 'usernames', name))).exists(), name === current);
            }
            await rename(r1, current);
            assert.equal((await getDoc(doc(r1.db, 'usernames', current))).data().uid, one.uid);
        });
        await check('a released name can be reclaimed and username login resolves the same UID after rename', async () => {
            const old = (await getDoc(doc(r2.db, 'users', two.uid))).data().username;
            await rename(r2, 'rename_one');
            assert.equal((await getDoc(doc(r2.db, 'usernames', old))).exists(), false);
            const signIn = httpsCallable(r2.functions, 'signInWithUsername');
            await assert.rejects(signIn({ username: old, password: 'Test-password-123' }), (error) => error.code === 'functions/unauthenticated');
            await signOut(r2.auth);
            const { data } = await signIn({ username: 'rename_one', password: 'Test-password-123' });
            assert.equal((await signInWithCustomToken(r2.auth, data.token)).user.uid, two.uid);
        });
        console.log(`${completed.length} Firebase integration checks passed.`);
        return completed;
    } finally {
        await Promise.all(clients.map((value) => deleteApp(value.app)));
    }
}
