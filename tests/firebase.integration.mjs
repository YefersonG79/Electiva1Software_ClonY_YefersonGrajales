import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import {
    connectAuthEmulator, createUserWithEmailAndPassword, getAuth, GoogleAuthProvider,
    signInWithCredential, signInWithCustomToken, signOut,
} from 'firebase/auth';
import {
    collection, collectionGroup, connectFirestoreEmulator, doc, getCountFromServer,
    getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, runTransaction,
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

function client() {
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

async function account(value, label) {
    return (await createUserWithEmailAndPassword(value.auth, `${label}@example.test`, 'Test-password-123')).user;
}

async function reserve(value, identity, username) {
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

async function rejected(promise) {
    await assert.rejects(promise, (error) => error.code === 'permission-denied');
}

function tweet(value, uid, content, extra = {}) {
    const ref = doc(collection(value.db, 'tweets'));
    return setDoc(ref, { id: ref.id, authorId: uid, content, createdAt: serverTimestamp(), ...extra });
}

async function follow(value, followerId, followingId) {
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
            const snapshot = await getDocs(query(collection(a.db, 'tweets'), where('authorId', '==', alice.uid), orderBy('createdAt', 'desc'), limit(10)));
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
        await check('Google credential authentication works in the Auth emulator', async () => {
            const identityToken = [
                Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
                Buffer.from(JSON.stringify({ sub: 'google-test-sub', email: 'google@example.test', email_verified: true, name: 'Google Test', aud: projectId, iss: 'https://accounts.google.com' })).toString('base64url'), '',
            ].join('.');
            const result = await signInWithCredential(guest.auth, GoogleAuthProvider.credential(identityToken));
            assert.equal(result.providerId, 'google.com');
        });
        console.log(`${completed.length} Firebase integration checks passed.`);
        return completed;
    } finally {
        await Promise.all(clients.map((value) => deleteApp(value.app)));
    }
}
