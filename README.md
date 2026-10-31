# Clon Y — Milestone 1

| Academic information | Value |
| --- | --- |
| Course | Electiva I — Desarrollo |
| Project | Clon Y — reconstruction of the ClonX_AI social SPA |
| Team | Individual project; no team |
| Member | Yeferson Grajales |
| Repository | [Electiva1Software_ClonY_YefersonGrajales](https://github.com/YefersonG79/Electiva1Software_ClonY_YefersonGrajales) |
| License | No license declared, as confirmed by the author. No LICENSE file is included. |

## Description and scope

Clon Y is a desktop SPA reconstructed from ClonX_AI with React, TypeScript, Vite, React Router DOM and Bootstrap. It provides registration and login screens, Home, publishing, followed users, followers, user profiles and Feed. Session, publications and following are simulated in React memory.

The updated `Clon de X.docx` and the academic GitHub delivery guide were inspected for this delivery. The [verification report](docs/milestone-1-verification.md) records the requirement matrix, executed checks, differences from ClonX_AI and outstanding requirements. The [AI log](bitacora.md) records the conversations available in this session.

**Known Milestone 1 gap:** the document requests a Google or alternative-provider login option. That visual option is absent from both this project and the supplied reference source. It was not added as an unrequested deviation. Real external-provider authentication belongs to a later milestone.

## Technologies and prerequisites

| Technology | Installed version / purpose |
| --- | --- |
| Node.js | Verified with 22.14.0 |
| npm | Verified with 10.9.2 |
| React / React DOM | 19.3.1; component rendering |
| TypeScript | 5.9.3; existing type configuration |
| Vite | 8.3.5; development and production build |
| React Router DOM | 6.30.6; BrowserRouter and nested routes |
| Bootstrap | 5.3.8; locally bundled CSS and built-in dark theme |
| Firebase SDK | 13.1.0; installed for future work, inactive in this milestone |
| Git | Source history and feature branches |

Use a current desktop browser with a viewport at least 1024 px wide. The reference layout intentionally uses a 1024 px minimum width, a centered 1140 px container, 440 px authentication cards and 40/64 px avatars. No additional CSS library or CDN is required.

## Installation and execution

For a fresh checkout:

```sh
git clone https://github.com/YefersonG79/Electiva1Software_ClonY_YefersonGrajales.git
cd Electiva1Software_ClonY_YefersonGrajales
npm ci
npm run dev
```

Open the local URL printed by Vite. On Windows PowerShell, use `npm.cmd` in place of `npm` if script execution policy blocks `npm.ps1`; no execution-policy change is required.

```sh
npm run lint
npm run build
npm run preview
```

The build checks TypeScript before producing `dist/`. Preview serves that production directory. A deployment host must return `index.html` for SPA URLs such as `/feed` and `/users/yeferson`.

Dependencies were already installed in the supplied workspace. A fresh `npm ci` was not rerun during this verification. No Firebase project, environment variables, credentials or backend are needed for the demonstration.

## Demo account and behavior

Sign in with the prefilled username **yeferson** and any nonempty test password. The password is not sent to a backend or stored. Registration has full name, username, email and password fields; it personalizes the existing demo identity instead of creating a real account.

The initial dataset contains **25 users, 350 tweets, 12 followed users and 15 followers**. Each user has 14 initial tweets. Following someone updates lists, counters and Feed. Publishing a multiline message displays it first in Feed and the current profile, with a success notice. Tweets show full name, handle, date/time in `America/Bogota` and their original line breaks.

All lists show **at most 10 records per page** through `?page=`. User lists use Spanish alphabetical full-name ordering; tweets use descending publication dates. User cards and tweet authors link to profiles.

Signing out ends the session. Mock data remains in the current page's memory until reload; reloading resets both the session and mock changes. No localStorage, sessionStorage, real registration, uniqueness validation, Firestore persistence, Google authentication or 280-character business limit is implemented. Following an existing connection displays a disabled “Siguiendo” button; unfollowing is outside the reference behavior.

## Routes

| Path | View |
| --- | --- |
| `/login` | Public username/password demo login |
| `/register` | Public four-field simulated registration |
| `/` | Protected Home, counters and publication access |
| `/publish` | Protected multiline publishing form |
| `/following` | Protected followed users, alphabetically sorted |
| `/followers` | Protected followers and conditional Follow buttons |
| `/users/:username` | Protected profile, counters and newest-first tweets |
| `/feed` | Protected tweets from the current user and followed users |

Protected links preserve the requested path and page through login. Unknown routes return to Home. Missing usernames display an empty state. The shared signed-in header links Home, shows the current name/handle and provides sign-out.

## Architecture

```text
src/main.tsx
  BrowserRouter
    AuthProvider
      BlogApp
        MockDataProvider
          BaseRouter
            AuthLayout / MainLayout
              Pages and reusable components
```

- `src/auth/`: typed simulated session, reducer, hooks, Login and Register.
- `src/data/`: mock datasets, shared state and sorting/filtering queries.
- `src/pages/`: Home, Publish, Connections, Profile and Feed. Connections serves both user-list modes.
- `src/components/`: layouts, common, tweet and user components.
- `src/ui/components/NavBar.tsx`: shared header.
- `src/hooks/usePagination.ts` and `src/utils/pagination.ts`: URL pagination and bounded slicing.
- `src/assets/styles/global.css`: original desktop helpers and multiline tweet styling.
- `src/firebase/`: inactive compatibility exports; no Firebase service is initialized or called.
- `public/`: original favicon and existing public resources.

`BlogApp` retains the original Bootstrap/global CSS imports and owns MockDataProvider. BaseRouter remains the single route definition. Starter App/CSS/assets are retained for traceability but are no longer imported by the active entry.

The reference Firebase provider calls real authentication. To respect this milestone's explicit scope, `FirebaseApp` and `FirebaseAuth` are typed null exports and `loginUserByCredentials` returns a controlled unavailable result. These modules are disconnected from the UI. This deliberate difference is documented rather than presenting real authentication as implemented.

## Verification and academic delivery

Executed on October 31, 2026 (America/Bogota):

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed, including TypeScript and the actual integrated SPA.
- Data/pagination checks: passed with 25 users, 350 tweets and the expected initial relationships.
- Chrome production-browser checks: **42 passed**, including the eight views at 1024, 1366 and 1920 px, publication, following, navigation, sign-out and protected deep links.
- Development server: eight route URLs returned the SPA and the integrated entry.
- Browser runtime/resource errors: zero; external application requests: zero.
- Home and Login desktop screenshots were inspected.

There is no configured `npm test` script or additional test-framework dependency. Session-specific browser/data scripts, JSON results, isolated Chrome profile and screenshots are under ignored `node_modules/.tmp/commit12/`; they are not part of a fresh checkout. Follow the report's manual steps to reproduce the functional checks.

The current work is on `feature/milestone-documentation`. No commit, push, merge or pull request was performed by this interaction. Proposed message:

```text
docs: completed milestone 1 integration and documentation
```

The AI log was absent from this branch and its available Git history. The recovered conversations cannot establish the progressive historical versioning required by the academic document. No conversations or timestamps for commits 1–6 were invented. Repository visibility, release-branch submission and any remote review remain the author's responsibility.

## License

The author confirmed that this is an individual project without a declared license. This repository does not assign a new license to the reference project or third-party dependencies; their own notices remain applicable. Selecting a project license is pending the author's decision.
