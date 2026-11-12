import { createHash } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
const webApiKey = defineString('AUTH_WEB_API_KEY', { default: 'demo-key' });
const db = getFirestore();
const invalidCredentials = () => new HttpsError('unauthenticated', 'Usuario o contraseña incorrectos.');

async function consumeAttempt(ip) {
    const id = createHash('sha256').update(ip).digest('hex');
    const ref = db.doc(`loginAttempts/${id}`);
    const now = Date.now();
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const previous = snapshot.data();
        const currentWindow = previous && previous.expiresAt.toMillis() > now;
        const attempts = currentWindow ? previous.attempts : 0;
        if (attempts >= 30) throw new HttpsError('resource-exhausted', 'Espera 15 minutos.');
        transaction.set(ref, {
            attempts: attempts + 1,
            expiresAt: currentWindow ? previous.expiresAt : Timestamp.fromMillis(now + 15 * 60 * 1000),
        });
    });
}

// The callable never returns emails or password-verification responses to the browser.
export const signInWithUsername = onCall({ region: 'us-central1', maxInstances: 5 }, async (request) => {
    const username = typeof request.data?.username === 'string' ? request.data.username.trim().replace(/^@/, '').toLowerCase() : '';
    const password = request.data?.password;
    if (!/^[a-z0-9_]{3,30}$/.test(username) || typeof password !== 'string' || !password || password.length > 4096) {
        throw invalidCredentials();
    }
    try {
        await consumeAttempt(request.rawRequest.ip || 'unknown');
        const reservation = await db.doc(`usernames/${username}`).get();
        const uid = reservation.data()?.uid;
        const profile = uid ? await db.doc(`privateUsers/${uid}`).get() : null;
        const email = profile?.data()?.email;
        const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
        const apiKey = webApiKey.value();
        if (!emulator && (!apiKey || apiKey === 'demo-key')) {
            throw new HttpsError('failed-precondition', 'Configura AUTH_WEB_API_KEY.');
        }
        const host = emulator ? `http://${emulator}/identitytoolkit.googleapis.com` : 'https://identitytoolkit.googleapis.com';
        // Unknown handles also perform a password check to keep the error behavior uniform.
        const response = await fetch(`${host}/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email || 'unknown@invalid.example', password, returnSecureToken: true }),
            signal: AbortSignal.timeout(10000),
        });
        const result = await response.json();
        if (!response.ok || !uid || result.localId !== uid) throw invalidCredentials();
        const identity = await getAuth().getUser(uid);
        if (identity.disabled || identity.email !== email) throw invalidCredentials();
        return { token: await getAuth().createCustomToken(uid) };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        // Credentials and upstream response bodies must never be logged.
        throw new HttpsError('unavailable', 'El servicio de acceso no está disponible.');
    }
});
