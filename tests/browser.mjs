import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runBrowser() {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run through npm run test:browser.');
    const output = path.resolve('node_modules/.tmp/milestone2');
    await mkdir(output, { recursive: true });
    const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], {
        windowsHide: true, stdio: 'pipe', env: { ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true' },
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
    const completed = [];
    let requestId = 0;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++requestId;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
        const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
        return value.result.value;
    };
    const waitFor = async (expression) => {
        for (let attempt = 0; attempt < 150; attempt += 1) {
            if (await evaluate(expression)) return;
            await pause(100);
        }
        throw new Error(`Browser condition timed out: ${expression}\n${await evaluate('document.body.innerText')}`);
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
            }
        });
        await send('Page.enable');
        await send('Runtime.enable');
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
        await waitFor('document.body.innerText.includes("Ahora sigues a este usuario")');
        await waitFor('document.querySelector(".user-stats")?.innerText.includes("1 Seguidos")');
        check('case-insensitive handle search and following update live counter');
        await evaluate('document.querySelector("#search-username").form.requestSubmit()');
        await waitFor('document.body.innerText.includes("Ya sigues a este usuario")');
        check('already-following notification and disabled duplicate action');
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
        await field('#username', 'carol');
        await field('#password', 'wrong-password');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('document.body.innerText.includes("Usuario o contraseña incorrectos")');
        check('sign-out, protected deep link and invalid login');
        await field('#password', 'Test-password-123');
        await evaluate('document.querySelector("form").requestSubmit()');
        await waitFor('location.pathname === "/following" && location.search === "?page=2" && document.querySelectorAll(".user-card").length === 1');
        check('valid username login returns to protected destination and preserves following');
        await send('Page.reload');
        await waitFor('document.querySelectorAll(".user-card").length === 1');
        await clickText('Mi perfil');
        await waitFor('document.querySelectorAll(".tweet-card").length === 1');
        check('tweets, relationships and identity persist after reload');
        await navigate('/users/not_found');
        await waitFor('document.body.innerText.includes("Usuario no encontrado")');
        check('missing user state');
        await clickText('Volver a Inicio');
        for (const width of [1024, 1366, 1920]) {
            await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
            assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Unexpected horizontal overflow at ${width}`);
        }
        check('existing desktop layout fits 1024, 1366 and 1920 pixels');
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
