# Testing Questify

Use Node.js 24+ and Java 21+ (for the official Firestore emulator).

```sh
npm ci
npm run test:e2e:install
npm test
npm run test:e2e
```

On a supported Linux distribution, install system browser dependencies once with
`npx playwright install --with-deps chromium firefox`. This workstation uses
Playwright's downloaded Linux browser builds. The first installation also downloads
Firestore emulator 1.22.0 from Google's official storage, checks its pinned SHA-256,
and caches it in `.cache/firebase/`. An existing verified Firebase CLI cache is reused.
No global Firebase CLI, Docker, cloud credentials or live project is required.

`npm run test:e2e` builds the real production app in `.next-e2e`, starts its custom
Socket.IO server on `127.0.0.1:3210`, a disposable Firestore database on port 8088,
and a local S3 transport fixture on port 4569. These ports must be free. The runner
refuses existing services, uses project `demo-questify-e2e`, masks cloud credential
aliases before `.env.local` loads, and shuts down its own services on completion.
Tests use unique browser-created accounts; database and uploaded bytes disappear
when the stack stops. Leave your regular dev server running on port 3000.

The suite exercises:

| Area | Checks |
| --- | --- |
| Authentication | Signup, logout, login, incorrect password, protected routes, forged cookies |
| Editor | Create/publish, persisted body and title, stable IDs, mixed true/false/typed/slide ordering, republish, deletion, incomplete-input validation |
| Media | UI upload, preview, real SDK PUT, signed redirect and downloaded bytes, removal, rejected SVG upload |
| API | Quiz CRUD, publication IDs, invalid payloads, unauthenticated/foreign owners, rejected client analytics, invalid media keys |
| Live sessions | Host/display/two players, text slides, pause/resume, correct/incorrect answers, reload/rejoin, persisted analytics |
| Polls | Neutral participant feedback, counted votes and unscored reports |
| Browsers | Chromium desktop, Firefox desktop, Chromium mobile; uncaught page errors and Next assets |

API cases run once in the `api` project. UI cases run in all three browser projects.
The presenter uses a large viewport; player/editor/auth screens exercise mobile.
These are regression checks for implemented features, not coverage of all roadmap
features. The media fixture tests HTTP transport and signing flow; it does not
validate Cloudflare permissions, signature verification, CDN or provider availability.
The external QR image is replaced locally. Firebase uses the real official emulator,
with client rules denying access and server Admin SDK access through Questify.

```sh
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=api
npm run test:e2e:ui
npm run test:e2e:report
npm run typecheck
npm run build
```

Failures retain screenshots, videos and traces for the primary test context in
`test-results/`. Additional guest contexts do not record their own videos or traces. The HTML report
is in `playwright-report/`. View a trace with `npx playwright show-trace <trace.zip>`.
Artifacts, builds and emulator binaries are ignored by Git and Docker. Build and
typecheck commands should run sequentially because Next regenerates route types.
The GitHub Actions workflow installs browsers and Java, runs Node and browser/API
tests, and uploads reports even after failures. It has not run remotely until pushed.

Playwright's webServer lifecycle and request fixtures follow the
[official Playwright documentation](https://playwright.dev/docs/test-webserver),
[API testing documentation](https://playwright.dev/docs/api-testing), and
[Firestore emulator setup](https://firebase.google.com/docs/emulator-suite/connect_firestore).
