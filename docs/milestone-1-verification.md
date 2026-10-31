# Milestone 1 integration and verification

Verification date: **2026-10-31, America/Bogota**. Branch: `feature/milestone-documentation`.

## Sources and scope

The current repository was compared with `ClonX_AI.zip`. The updated assignment was read from `C:/Users/yef02/OneDrive/Desktop/Clon de X.docx`, including the Milestone 1 tasks and AI/Git rules. The five-page `Guía para la Entrega de Proyectos con GITHUB.pdf` was also read. These are reference documents, not authorization to perform their suggested commits, merges, publication or future-milestone work.

The user confirmed individual work by **Yeferson Grajales**, without a team or declared license. No other contributors, license or academic institution were invented.

The SPA integration is executable and the requested simulated flows were verified. Full assignment compliance is **not** claimed: the alternative-provider login option and progressive AI-log history have the limitations listed below.

## Integration changes

- `src/main.tsx`: restores the reference BrowserRouter → AuthProvider → BlogApp composition and removes starter CSS/App imports from the active entry.
- `index.html`: restores Spanish, Bootstrap dark mode, description and theme color; keeps the project's Clon Y title.
- `src/firebase/config.ts`: preserves the FirebaseApp/FirebaseAuth export names as typed null values.
- `src/firebase/providers.ts`: preserves the credentials-provider API shape but returns an unavailable result without invoking Firebase.
- `README.md`: replaces the starter instructions with the verified academic project description, setup, scope, license status and results.
- `bitacora.md`: recovers only exchanges available in this conversation and appends the current interaction.
- This report records current evidence rather than copying the reference README's historical test claims.

`BlogApp`, `BaseRouter`, all pages, components, datasets, styles, package/lock files and tool configurations were kept intact because their existing imports and behavior were compatible.

## Requirement matrix

“Passed” below refers to the executed simulated UI, not real authentication or persistence.

| # | Requested requirement | Executed evidence | Result |
| --- | --- | --- | --- |
| 1 | Login | Username/password form, demo sign-in, protected return with `?page=2` | Passed for the form; Google option is missing |
| 2 | Register | Four labeled fields; submitted test data updated header and Home | Passed, simulated |
| 3 | Home counters | Initial 12 following/15 followers; counters updated after following | Passed |
| 4 | Publication form | Multiline message appeared first in Feed and own profile; success notice | Passed, simulated |
| 5 | Following | All 12 initial users traversed as 10 + 2 | Passed |
| 6 | Followers | All 15 initial users traversed as 10 + 5 | Passed |
| 7 | User tweets | Other profile traversed as 10 + 4; own profile excluded self-follow | Passed |
| 8 | Feed | All 182 initial tweets traversed; only own/followed authors | Passed |
| 9 | Header and sign-out | Current full name/handle, Home link and session exit | Passed |
| 10 | Navigation | All eight views, author/profile links, unknown routes/users and protected deep links | Passed |
| 11 | Alphabetical users | Spanish full-name order across every user-list page, no duplicates | Passed |
| 12 | Descending tweets | Full profile and Feed traversals checked descending timestamps | Passed |
| 13 | At most 10 items | User and tweet pages, last pages, negative/nonnumeric/oversized page values | Passed |
| 14 | Simulated Follow | Following from Followers and Profile updated lists, both counters and Feed | Passed |

## Executed technical checks

| Check | Actual result |
| --- | --- |
| `npm.cmd run lint` | Exit 0; no errors or warnings |
| `npm.cmd run build` | Exit 0; TypeScript and Vite succeeded; 55 modules transformed |
| Data/pagination script | Passed: 25 unique users, 350 valid tweets, valid unique relationships, 12 following, 15 followers, 14 tweets/user |
| Sorting/filtering/pagination | Passed: Spanish alphabetical order, chronological eligible Feed, complete traversal without omissions/duplicates, invalid/empty boundaries |
| Chrome against production at `http://127.0.0.1:4174` | **42 checks passed** |
| Desktop layouts | All eight views at 1024, 1366 and 1920 px; no horizontal overflow |
| Development HTTP at `http://127.0.0.1:5174` | Eight route URLs returned 200 with the integrated SPA entry and dark-theme HTML |
| Firebase inactive modules | Null instances and controlled unavailable credentials result verified |
| Browser runtime/resource errors | 0 |
| External application service requests | 0; no Firebase call |
| Visual inspection | Actual Home and Login captures at 1366 px inspected |

The first browser attempt inside the restricted sandbox timed out at Chrome's CDP `Page.enable` command. It did not pass. The same isolated local test then ran outside that process sandbox and passed all 42 checks. The result above refers exclusively to the successful executed run.

The existing reference browser script was adapted to the current app and port. Its obsolete Google-button click was removed because no such button exists in either reference source or the reconstructed Login. The Login check verifies only the implemented username/password form. Existing historical “Google passed” statements from the reference documentation were not reused.

The Chrome suite exercises the **production bundle**. Development URLs were additionally checked over HTTP; a second full browser run against the dev server was not performed. No new test framework or dependency was installed, and a fresh `npm ci` was not executed.

Temporary evidence under ignored `node_modules/.tmp/commit12/`:

- `browser-smoke.mjs` and `desktop-final-results.json`: executed browser checks and their actual results.
- `data-check.mjs`: executed reference-data and pagination checks.
- `desktop-*-1366.png`: captures of the eight actual views.
- `commit12-browser-profile/`: isolated local Chrome profile.

These ignored artifacts are local verification evidence, not files promised in a fresh clone.

## Differences from ClonX_AI

| Area | Difference and reason |
| --- | --- |
| Main entry | Restored to the reference composition; previously mounted the Vite starter |
| Branding | Existing Clon Y labels and new HTML title instead of Clon X |
| Demo identity | Existing Yeferson/yeferson identity instead of Alex/alexrivera; counts and relationships remain coherent |
| Firebase | Deliberately inactive compatibility modules instead of reference initialization and real sign-in; requested mock-only scope |
| Auth reducer | Existing `authReducer` name instead of `AuthReducer`; its unused error action preserves state, while the reference resets the session. Login/logout paths match and were tested; no error-action behavior was changed |
| Copy/guard messages | Existing small differences in Login/Register text and hook error wording; left intact |
| Packages | Existing local versions differ slightly from the ZIP; no package/lock/config changes were required |
| Unused files | Original About/Support templates were not needed or added; their old URLs redirect Home. Existing Vite starter files remain unused |
| Documentation | Current project/team/license facts and executed evidence replace reference-specific historical claims |

The shared social/common components, feature pages, pagination logic, desktop CSS and visual assets created in commits 7–11 remain the reference implementations.

## Outstanding requirements and boundaries

1. **Google or another provider option:** required visually by the updated Milestone 1 document, but missing from the actual Login source in both projects. No real or visual provider flow was added in this fidelity-focused integration. The reference README/report incorrectly claims a visual Google option.
2. **Progressive AI-log versioning:** there was no `bitacora.md` in the branch or the inspected Git history. Recovering visible conversations now cannot recreate commits that were never made. No missing interactions for commits 1–6 or original times were invented.
3. **License:** the author explicitly confirmed none is declared. The README states that fact; no license was selected on the author's behalf.
4. **Git delivery:** no commit, push, merge, PR, release branch or remote-visibility change was made. Academic publication/submission remains manual.
5. **Later milestones:** real registration/authentication, Google authentication, uniqueness checks, Firestore persistence, the 280-character business rule and additional following forms remain outside this delivery.
6. **Viewport scope:** the original desktop-only minimum width is preserved; mobile layout compliance was not claimed or tested.

There are **no pending compilation errors or missing package dependencies** after integration. The Google UI gap prevents declaring complete compliance with every Milestone 1 document item.

## Manual reproduction

1. Run `npm ci` in a fresh checkout, then `npm run dev`. Open the URL printed by Vite.
2. Open `/login`; check the username/password fields. The expected Google option is currently absent.
3. Register test data with all four fields. Check the personalized header and Home counters 12/15.
4. Open Following and Followers. Traverse 10 + 2 and 10 + 5 users, check alphabetical names and open a profile.
5. Follow an unfollowed follower. Check the disabled “Siguiendo” state, increased following counter, profile follower counter and newly included Feed tweets.
6. Traverse another user's 14 tweets and the initial 182 eligible Feed tweets. Check author metadata, dates, descending order and pages of at most 10.
7. Publish a multiline message. Check its success notice and first position in Feed and the current profile.
8. Follow someone from their profile; inspect the updated counters. Own profile must not show a self-follow button.
9. Test `/users/not-in-demo`, `/following?page=-7`, `?page=not-a-number`, `?page=999` and an unknown URL.
10. Use sign-out, then open `/followers?page=2` directly. Sign in with any nonempty test password; verify return to page 2.
11. Reload and sign in again. Initial mock counts return to 12/15. Inspect browser console/network and verify no external authentication/database request.
12. Run lint, build and preview. Check all eight desktop views at 1024, 1366 and 1920 px.

The intended manual commit message is `docs: completed milestone 1 integration and documentation`.
