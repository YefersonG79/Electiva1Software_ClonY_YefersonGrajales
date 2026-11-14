import { runIntegration } from './firebase.integration.mjs';
import { runBrowser } from './browser.mjs';
import { runMilestone3Integration } from './milestone3.integration.mjs';

await runIntegration();
await runMilestone3Integration();
if (process.argv.includes('--browser')) await runBrowser();
