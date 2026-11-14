# Clon Y — Milestone 1

| Academic information | Value |
| --- | --- |
| Course | Electiva I — Desarrollo |
| Project | Clon Y — reconstruction of the ClonX_AI social SPA |
| Team | Individual project; no team |
| Member | Yeferson Grajales |
| Repository | [Electiva1Software_ClonY_YefersonGrajales](https://github.com/YefersonG79/Electiva1Software_ClonY_YefersonGrajales) |
| License | No license declared, as confirmed by the author. No LICENSE file is included. |


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


## License

The author confirmed that this is an individual project without a declared license. This repository does not assign a new license to the reference project or third-party dependencies; their own notices remain applicable. Selecting a project license is pending the author's decision.