import { runIntegration } from './firebase.integration.mjs';
import { runBrowser } from './browser.mjs';

await runIntegration();
if (process.argv.includes('--browser')) await runBrowser();
