import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runMilestone3Browser } from './milestone3.browser.mjs';
import { runUnfollowBrowser } from './unfollow.browser.mjs';

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runBrowser() {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run through npm run test:browser.');
    const output = path.resolve('node_modules/.tmp/milestone2');
    await mkdir(output, { recursive: true });
    const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], {
        windowsHide: true, stdio: 'pipe', env: {
            ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true', VITE_FIREBASE_API_KEY: 'demo-key',
            VITE_FIREBASE_AUTH_DOMAIN: 'demo-clon-y.firebaseapp.com', VITE_FIREBASE_PROJECT_ID: 'demo-clon-y',
            VITE_FIREBASE_APP_ID: 'demo-app', VITE_FIREBASE_FUNCTIONS_REGION: 'us-central1',
        },
    });
    let serverOutput = '';
    server.stderr.on('data', (data) => { serverOutput += data; });
    server.stdout.on('data', (data) => { serverOutput += data; });
    const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
    const browser = spawn(chrome, [
        '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        '--disable-background-networking', '--disable-component-update', '--disable-sync',
        '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9226',
        `--user-data-dir=${path.join(output, `chrome-${Date.now()}`)}`, 'about:blank',
    ], { windowsHide: true, stdio: 'ignore' });
    let socket;
    const pending = new Map();
    const errors = [];
    const credentialRequests = [];
    const firestoreCommits = [];
    const completed = [];
    let requestId = 0;
    const request = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
        const id = ++requestId;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
    const send = async (method, params = {}, sessionId) => {
        if (method !== 'Page.reload') return request(method, params, sessionId);
        // Do not let a condition match the previous document while reload starts.
        const marker = `reload-${requestId}`;
        await request('Runtime.evaluate', { expression: `globalThis.__clonYReloadMarker = ${JSON.stringify(marker)}` }, sessionId);
        await request(method, params, sessionId);
        for (let attempt = 0; attempt < 150; attempt += 1) {
            try {
                const state = await request('Runtime.evaluate', {
                    expression: `document.readyState === 'complete' && globalThis.__clonYReloadMarker !== ${JSON.stringify(marker)}`,
                    returnByValue: true,
                }, sessionId);
                if (state.result?.value === true) return {};
            } catch { /* The old execution context may disappear during navigation. */ }
            await pause(100);
        }
        throw new Error('Browser reload did not finish');
    };
    const evaluate = async (expression, sessionId) => {
        const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, sessionId);
        if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
        return value.result.value;
    };
    const waitFor = async (expression, sessionId) => {
        for (let attempt = 0; attempt < 150; attempt += 1) {
            if (await evaluate(expression, sessionId)) return;
            await pause(100);
        }
        throw new Error(`Browser condition timed out: ${expression}\n${await evaluate('document.body.innerText', sessionId)}`);
    };
    const field = async (selector, value) => {
        await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.focus(); e.select(); })()`);
        await send('Input.insertText', { text: value });
    };
    const clickText = async (text) => {
        const clicked = await evaluate(`(() => { const e = [...document.querySelectorAll('a,button')].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!e) return false; e.click(); return true; })()`);
        assert.ok(clicked, `Missing control: ${text}`);
    };
    const navigate = async (url) => { await send('Page.navigate', { url: `http://127.0.0.1:4175${url}` }); await waitFor('document.readyState === "complete"'); };
    const check = (name) => { completed.push(name); console.log(`PASS browser: ${name}`); };
    const screenshot = async (name) => {
        const capture = await send('Page.captureScreenshot', { format: 'png' });
        await writeFile(path.join(output, `${name}.png`), Buffer.from(capture.data, 'base64'));
    };
    try {
        for (let attempt = 0; attempt < 100; attempt += 1) {
            try { if ((await fetch('http://127.0.0.1:4175')).ok) break; } catch { /* Wait for Vite. */ }
            if (attempt === 99) throw new Error(serverOutput);
            await pause(100);
        }
        let target;
        for (let attempt = 0; attempt < 100; attempt += 1) {
            try { target = (await (await fetch('http://127.0.0.1:9226/json/list')).json()).find((item) => item.type === 'page'); } catch { /* Wait for Chrome. */ }
            if (target) break;
            await pause(100);
        }
        assert.ok(target, 'Set CHROME_PATH to a Chrome/Chromium executable.');
        socket = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.id) {
                const request = pending.get(message.id);
                if (!request) return;
                pending.delete(message.id);
                clearTimeout(request.timer);
                if (message.error) request.reject(new Error(JSON.stringify(message.error)));
                else request.resolve(message.result);
            } else if (message.method === 'Runtime.exceptionThrown') {
                errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
            } else if (message.method === 'Network.requestWillBeSent' && message.params.request.method === 'POST') {
                const url = message.params.request.url;
                if (url.includes('accounts:signInWithPassword') || url.includes('/signInWithUsername')) credentialRequests.push(url);
                if (url.includes('/documents:commit')) firestoreCommits.push(url);
            }
        });
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Network.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
        await navigate('/register');
        await waitFor('Boolean(document.querySelector("#fullName")) && !document.querySelector("button[type=submit]").disabled');
        await field('#fullName', 'Carol Test');
        await field('#username', 'carol');
        await field('#email', 'alice@example.test');
        await field('#password', 'Test-password-123');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('document.body.innerText.includes("Este correo ya está registrado")');
        check('duplicate email message');
        await field('#username', 'alice');
        await field('#email', 'carol@example.test');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('document.body.innerText.includes("ya está ocupado")');
        check('duplicate username rejected and registration account rolled back');
        await field('#username', 'carol');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('Boolean(document.querySelector("header.navbar")) && document.body.innerText.includes("Tu cuenta se creó correctamente")');
        await waitFor('document.querySelector(".user-stats")?.innerText.includes("0 Seguidos")');
        check('registration with reused email after rollback; real counters start at zero');
        await send('Page.reload');
        await waitFor('Boolean(document.querySelector("header.navbar")) && document.body.innerText.includes("Carol Test")');
        check('session restored after browser reload');
        await clickText('Publicar');
        await waitFor('Boolean(document.querySelector("#tweet-content"))');
        assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), true);
        await field('#tweet-content', 'x'.repeat(281));
        assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), true);
        assert.equal(await evaluate('document.querySelector("#tweet-content").getAttribute("aria-invalid")'), 'true');
        await field('#tweet-content', 'x'.repeat(280));
        assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), false);
        check('empty and over-280 tweets blocked; exactly 280 accepted by form');
        await field('#tweet-content', 'Browser publication\nSecond line');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('document.body.innerText.includes("Tu tweet se publicó correctamente") && Boolean(document.querySelector(".tweet-card"))');
        assert.equal(await evaluate('document.querySelector(".tweet-body").textContent'), 'Browser publication\nSecond line');
        check('publication saved, success notice shown and feed refreshed with line breaks');
        await clickText('Inicio');
        await field('#search-username', '@ALICE');
        await evaluate('document.querySelector("#search-username").form.requestSubmit()');
        await waitFor('Boolean(document.querySelector(".user-card"))');
        await clickText('Seguir');
        await waitFor('document.querySelector(".user-card button")?.textContent === "Siguiendo" && !document.querySelector(".user-card button").disabled');
        await waitFor('document.querySelector(".user-stats")?.innerText.includes("1 Seguidos")');
        check('case-insensitive handle search and following update live counter');
        await evaluate('document.querySelector("#search-username").form.requestSubmit()');
        await waitFor('document.querySelector(".user-card button")?.textContent === "Siguiendo" && !document.querySelector(".user-card button").disabled');
        assert.equal(await evaluate('document.querySelector(".user-card button").getAttribute("aria-pressed")'), 'true');
        assert.equal(await evaluate('Boolean(document.querySelector(".user-card [role=status]"))'), false);
        check('following state supports unfollow without redundant success messages');
        await screenshot('home');
        await clickText('Seguidos');
        await waitFor('document.querySelectorAll(".user-card").length === 1');
        await evaluate('document.querySelector(".user-card a").click()');
        await waitFor('document.querySelectorAll(".tweet-card").length === 10');
        assert.ok(await evaluate('document.querySelector(".profile-details").textContent.includes("alice")'));
        const firstPageTweets = await evaluate('[...document.querySelectorAll(".tweet-body")].map(e => e.textContent)');
        await screenshot('profile');
        await clickText('Siguiente');
        await waitFor('document.querySelectorAll(".tweet-card").length === 5');
        const secondPageTweets = await evaluate('[...document.querySelectorAll(".tweet-body")].map(e => e.textContent)');
        assert.ok(secondPageTweets.every((content) => !firstPageTweets.includes(content)), 'Tweet pages must not overlap when timestamps are equal');
        check('followed-user profile has newest-first tweets with 10 + 5 pagination');
        await clickText('Feed');
        await waitFor('document.querySelectorAll(".tweet-card").length === 10');
        assert.equal(await evaluate('document.querySelector(".tweet-body").textContent'), 'Browser publication\nSecond line');
        check('feed combines current user and followed authors');
        await clickText('Seguidores');
        await waitFor('document.body.innerText.includes("Tu comunidad está por crecer")');
        check('empty followers state');
        await clickText('Cerrar sesión');
        await waitFor('Boolean(document.querySelector("#password")) && !document.querySelector("button[type=submit]").disabled');
        await navigate('/following?page=2');
        await waitFor('location.pathname === "/login" && Boolean(document.querySelector("#username")) && !document.querySelector("button[type=submit]").disabled');
        assert.equal(await evaluate('document.querySelector("label[for=username]").textContent'), 'Correo electrónico o nombre de usuario');
        const requestsBeforeValidation = credentialRequests.length;
        await field('#password', 'Test-password-123');
        for (const [identifier, message] of [
            ['ab', 'entre 3 y 30'], ['name space', 'entre 3 y 30'], ['x'.repeat(31), 'entre 3 y 30'],
            ['carol@', 'correo electrónico válido'], ['carol@@example.test', 'correo electrónico válido'],
            ['carol @example.test', 'correo electrónico válido'], ['carol@example', 'correo electrónico válido'],
            ['@carol@example.test', 'correo electrónico válido'],
        ]) {
            await field('#username', identifier);
            await evaluate('document.querySelector("form").requestSubmit()');
            await waitFor(`document.querySelector('[role=alert]')?.textContent.includes(${JSON.stringify(message)}) && !document.querySelector('button[type=submit]').disabled`);
        }
        assert.equal(credentialRequests.length, requestsBeforeValidation, 'Invalid identifiers must not call either credential endpoint');
        const missingCredentials = await evaluate(`(async () => {
            const { signInWithCredentials } = await import('/src/services/auth.ts');
            const messages = [];
            for (const [identifier, password] of [['  ', 'password'], ['carol@example.test', ''], ['carol', '']]) {
                try { await signInWithCredentials(identifier, password); } catch (error) { messages.push(error.message); }
            }
            return messages;
        })()`);
        assert.deepEqual(missingCredentials, ['Escribe tu correo electrónico o nombre de usuario.', 'Escribe tu contraseña.', 'Escribe tu contraseña.']);
        assert.ok(await evaluate('[...document.querySelectorAll("button")].some(button => button.textContent === "Continuar con Google" && !button.disabled)'));
        check('login validates email and username formats separately before calling Firebase; Google remains available');
        await field('#username', ' @CAROL ');
        await field('#password', 'wrong-password');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('document.body.innerText.includes("Usuario o contraseña incorrectos")');
        check('sign-out, protected deep link and invalid login');
        await field('#password', 'Test-password-123');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('location.pathname === "/following" && location.search === "?page=2" && document.querySelectorAll(".user-card").length === 1');
        assert.ok(credentialRequests.slice(requestsBeforeValidation).some((url) => url.includes('/signInWithUsername')));
        check('valid username login returns to protected destination and preserves following');
        await send('Page.reload');
        await waitFor('document.querySelectorAll(".user-card").length === 1');
        await clickText('Mi perfil');
        await waitFor('document.querySelectorAll(".tweet-card").length === 1');
        check('tweets, relationships and identity persist after reload');
        const originalUid = await evaluate('(async () => (await import("/src/firebase/config.ts")).requireFirebase().auth.currentUser.uid)()');
        await clickText('Cambiar nombre de usuario');
        await waitFor('Boolean(document.querySelector("#new-username")) && document.body.innerText.includes("Nombre actual: @carol")');
        assert.equal(await evaluate('Boolean(document.querySelector("input[type=email],input[type=password]"))'), false);
        await field('#new-username', 'ab');
        await evaluate('document.querySelector("#new-username").form.requestSubmit()');
        await waitFor('document.querySelector("[role=alert]")?.textContent.includes("entre 3 y 30")');
        check('profile settings shows current handle, validates format and exposes only username');
        await field('#new-username', 'alice');
        await evaluate('document.querySelector("#new-username").form.requestSubmit()');
        await waitFor('document.querySelector("[role=alert]")?.textContent.includes("ya está ocupado")');
        assert.ok(await evaluate('document.querySelector("header.navbar").textContent.includes("@carol")'));
        check('occupied handle rejected without changing the header');
        await field('#new-username', ' @CAROL_UPDATED ');
        await evaluate('document.querySelector("#new-username").form.requestSubmit()');
        await waitFor('document.body.innerText.includes("Tu nombre de usuario se actualizó correctamente") && document.querySelector("header.navbar").textContent.includes("@carol_updated")');
        assert.equal(await evaluate('(async () => (await import("/src/firebase/config.ts")).requireFirebase().auth.currentUser.uid)()'), originalUid);
        assert.equal(await evaluate('[...document.querySelectorAll("a")].find(e => e.textContent === "Mi perfil").getAttribute("href")'), '/users/carol_updated');
        check('saving normalizes the username and updates header and profile link without reloading or changing UID');
        await evaluate('document.querySelector("#new-username").form.requestSubmit()');
        await waitFor('document.body.innerText.includes("Ya utilizas este nombre")');
        await screenshot('username-settings');
        await clickText('Volver a mi perfil');
        await waitFor('location.pathname === "/users/carol_updated" && document.querySelectorAll(".tweet-card").length === 1 && document.querySelector(".user-stats")?.textContent.includes("1 Seguidos")');
        assert.ok(await evaluate('document.querySelector(".tweet-card").textContent.includes("@carol_updated")'));
        await send('Page.reload');
        await waitFor('document.querySelector("header.navbar")?.textContent.includes("@carol_updated") && document.querySelectorAll(".tweet-card").length === 1');
        check('renamed profile, own tweets and relationships persist after reload');
        await clickText('Cerrar sesión');
        await waitFor('Boolean(document.querySelector("#password")) && !document.querySelector("button[type=submit]").disabled');
        await field('#username', 'carol');
        await field('#password', 'Test-password-123');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('document.body.innerText.includes("Usuario o contraseña incorrectos")');
        await field('#username', 'carol_updated');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('location.pathname === "/" && document.querySelector("header.navbar")?.textContent.includes("@carol_updated")');
        assert.equal(await evaluate('document.body.innerText.includes("Iniciaste sesión correctamente")'), false);
        check('new handle signs in with existing password, old handle fails, and login success has no redundant banner');
        await clickText('Cerrar sesión');
        await waitFor('Boolean(document.querySelector("#password")) && !document.querySelector("button[type=submit]").disabled');
        await navigate('/following?page=2');
        await waitFor('location.pathname === "/login" && Boolean(document.querySelector("#username")) && !document.querySelector("button[type=submit]").disabled');
        const requestsBeforeEmail = credentialRequests.length;
        for (const email of ['carol@example.test', 'a.long.unknown.email.account@example.test']) {
            await field('#username', email);
            await field('#password', 'wrong-password');
            await evaluate('document.querySelector("form").requestSubmit()');
            await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Usuario o contraseña incorrectos") && !document.querySelector("button[type=submit]").disabled');
            assert.equal(await evaluate('document.querySelector("[role=alert]").textContent.includes("auth/")'), false);
        }
        check('incorrect email passwords and unknown long email addresses show a generic credential error');
        await field('#username', '  CAROL@EXAMPLE.TEST  ');
        await field('#password', 'Test-password-123');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('location.pathname === "/following" && location.search === "?page=2" && document.querySelectorAll(".user-card").length === 1');
        assert.equal(await evaluate('(async () => (await import("/src/firebase/config.ts")).requireFirebase().auth.currentUser.uid)()'), originalUid);
        const emailRequests = credentialRequests.slice(requestsBeforeEmail);
        assert.equal(emailRequests.filter((url) => url.includes('accounts:signInWithPassword')).length, 3);
        assert.equal(emailRequests.some((url) => url.includes('/signInWithUsername')), false);
        check('email login calls Firebase Auth directly and restores the protected destination and existing UID');
        await send('Page.reload');
        await waitFor('document.querySelector("header.navbar")?.textContent.includes("@carol_updated") && document.querySelectorAll(".user-card").length === 1');
        assert.equal(await evaluate('(async () => (await import("/src/firebase/config.ts")).requireFirebase().auth.currentUser.uid)()'), originalUid);
        check('email-authenticated session and relationships persist after reload');
        await navigate('/users/alice');
        await waitFor('document.querySelectorAll(".tweet-card").length === 10');
        assert.equal(await evaluate('document.body.innerText.includes("Cambiar nombre de usuario")'), false);
        assert.equal(await evaluate('Boolean(document.querySelector("#new-username"))'), false);
        check('other users profiles expose no rename controls');
        await navigate('/users/not_found');
        await waitFor('document.body.innerText.includes("Usuario no encontrado")');
        check('missing user state');
        await clickText('Volver a Inicio');
        for (const width of [1024, 1366, 1920]) {
            await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
            assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Unexpected horizontal overflow at ${width}`);
        }
        check('existing desktop layout fits 1024, 1366 and 1920 pixels');
        await clickText('Cerrar sesión');
        await waitFor('Boolean(document.querySelector("#password"))');
        // Google credentials are emulator-only; no real Google account or popup is touched.
        const googleToken = [
            Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
            Buffer.from(JSON.stringify({ sub: 'google-browser-sub', email: 'google-browser@example.test', email_verified: true, name: 'Google Browser', aud: 'demo-clon-y', iss: 'https://accounts.google.com' })).toString('base64url'), '',
        ].join('.');
        const googleUid = await evaluate(`(async () => {
            const { requireFirebase } = await import('/src/firebase/config.ts');
            const { signInWithCredential, GoogleAuthProvider } = await import('/node_modules/.vite/deps/firebase_auth.js');
            const { ensureGoogleProfile } = await import('/src/services/users.ts');
            const { user } = await signInWithCredential(requireFirebase().auth, GoogleAuthProvider.credential(${JSON.stringify(googleToken)}));
            await ensureGoogleProfile(user);
            return user.uid;
        })()`);
        await waitFor('document.querySelector("header.navbar")?.textContent.includes("Google Browser")');
        assert.match(await evaluate('document.querySelector("header.navbar .text-body-secondary").textContent'), /^@googlebrowser_[a-f0-9]{10}$/);
        await clickText('Mi perfil');
        await waitFor('document.body.innerText.includes("Cambiar nombre de usuario")');
        await clickText('Cambiar nombre de usuario');
        await waitFor('Boolean(document.querySelector("#new-username"))');
        await field('#new-username', 'google_custom');
        await evaluate('document.querySelector("#new-username").form.requestSubmit()');
        await waitFor('document.querySelector("header.navbar")?.textContent.includes("@google_custom") && document.body.innerText.includes("se actualizó correctamente")');
        assert.deepEqual(await evaluate(`(async () => {
            const user = (await import('/src/firebase/config.ts')).requireFirebase().auth.currentUser;
            return { uid: user.uid, providers: user.providerData.map(item => item.providerId) };
        })()`), { uid: googleUid, providers: ['google.com'] });
        check('Google first-access generated username can be customized while preserving UID and Google provider');
        const recovery = await evaluate(String.raw`(async () => {
            const { requireFirebase } = await import('/src/firebase/config.ts');
            // Use Vite's exact SDK URL to share the application's Firestore instance.
            const configSource = await (await fetch('/src/firebase/config.ts')).text();
            const sdkUrl = configSource.match(/from\s+["']([^"']*firebase_firestore\.js[^"']*)["']/)?.[1];
            if (!sdkUrl) throw new Error('Firestore SDK module URL was not found');
            const { collection } = await import(sdkUrl);
            const { subscribeToQuery } = await import('/src/services/firestoreQueries.ts');
            const { errorMessage } = await import('/src/services/errors.ts');
            const probe = (code, cancel = false) => new Promise((resolve, reject) => {
                let deliveries = 0, failures = 0, cacheAfterError = 0, visibleError = '';
                const timer = setTimeout(() => { stop(); reject(new Error('Query recovery timed out')); }, 10000);
                const finish = () => { stop(); clearTimeout(timer); resolve({ deliveries, failures, cacheAfterError, visibleError }); };
                const stop = subscribeToQuery(collection(requireFirebase().db, 'users'), 'Prueba de recuperación', (snapshot) => {
                    if (snapshot.metadata.fromCache) { if (failures) cacheAfterError++; return; }
                    deliveries++;
                    if (deliveries === 1) throw Object.assign(new Error('Simulated query failure: docs/internal'), { code });
                    visibleError = '';
                    finish();
                }, (error) => {
                    failures++;
                    visibleError = errorMessage(error);
                    if (cancel) stop();
                    if (cancel || code === 'permission-denied') setTimeout(finish, 1500);
                });
            });
            return {
                recovered: await probe('failed-precondition'),
                denied: await probe('permission-denied'),
                cancelled: await probe('unavailable', true),
            };
        })()`);
        assert.deepEqual(recovery.recovered, { deliveries: 2, failures: 1, cacheAfterError: 0, visibleError: '' });
        for (const result of [recovery.denied, recovery.cancelled]) {
            assert.equal(result.deliveries, 1);
            assert.equal(result.failures, 1);
            assert.ok(result.visibleError);
            assert.equal(result.visibleError.includes('docs/'), false);
            assert.equal(result.visibleError.includes('permission-denied'), false);
        }
        check('transient query errors recover only from server snapshots; permission errors remain visible and unsubscribe cancels recovery');
        await clickText('Cerrar sesión');
        await waitFor('Boolean(document.querySelector("#password")) && !document.querySelector("button[type=submit]").disabled');
        for (const identifier of ['google-browser@example.test', 'google_custom']) {
            await field('#username', identifier);
            await field('#password', 'Test-password-123');
            await evaluate('document.querySelector("form").requestSubmit()');
            await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Usuario o contraseña incorrectos") && !document.querySelector("button[type=submit]").disabled');
            assert.equal(await evaluate('(async () => (await import("/src/firebase/config.ts")).requireFirebase().auth.currentUser)()'), null);
        }
        check('Google-only account is denied password access by both email and username');
        await clickText('Continuar con Google');
        let googlePopup;
        for (let attempt = 0; attempt < 100; attempt += 1) {
            const { targetInfos } = await send('Target.getTargets');
            googlePopup = targetInfos.find((target) => target.type === 'page' && target.url.startsWith('http://127.0.0.1:9099/emulator/auth/handler'));
            if (googlePopup) break;
            await pause(100);
        }
        assert.ok(googlePopup, 'The Google button must open the Auth emulator popup');
        const { sessionId: popupSession } = await send('Target.attachToTarget', { targetId: googlePopup.targetId, flatten: true });
        await waitFor('document.readyState === "complete" && [...document.querySelectorAll(".js-reuse-account")].some(account => account.textContent.includes("google-browser@example.test"))', popupSession);
        await evaluate('setTimeout(() => [...document.querySelectorAll(".js-reuse-account")].find(account => account.textContent.includes("google-browser@example.test")).click(), 0)', popupSession);
        await waitFor('document.querySelector("header.navbar")?.textContent.includes("@google_custom")');
        assert.deepEqual(await evaluate(`(async () => {
            const user = (await import('/src/firebase/config.ts')).requireFirebase().auth.currentUser;
            return { uid: user.uid, providers: user.providerData.map(item => item.providerId) };
        })()`), { uid: googleUid, providers: ['google.com'] });
        await send('Page.reload');
        await waitFor('document.querySelector("header.navbar")?.textContent.includes("@google_custom")');
        check('unchanged Google button completes the emulator popup flow and restores the original persistent account');
        await runMilestone3Browser({ evaluate, waitFor, navigate, clickText, field, send, check, screenshot });
        await runUnfollowBrowser({ evaluate, waitFor, navigate, clickText, field, send, check, screenshot, commits: firestoreCommits });
        assert.deepEqual(errors, [], 'Unexpected browser runtime errors');
        check('no browser runtime exceptions');
        await writeFile(path.join(output, 'browser-results.json'), JSON.stringify({ completed, errors }, null, 2));
        return completed;
    } finally {
        if (socket?.readyState === WebSocket.OPEN) {
            try { await send('Browser.close'); } catch { /* Chrome may close the socket before replying. */ }
            socket.close();
        }
        browser.kill();
        server.kill();
        for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('Browser closed')); }
    }
}
