import { runIntegration } from './firebase.integration.mjs';
import { runBrowser } from './browser.mjs';
import { runMilestone3Integration } from './milestone3.integration.mjs';
import { runUnfollowIntegration } from './unfollow.integration.mjs';

await runIntegration();
await runMilestone3Integration();
await runUnfollowIntegration();
if (process.argv.includes('--browser')) await runBrowser();
