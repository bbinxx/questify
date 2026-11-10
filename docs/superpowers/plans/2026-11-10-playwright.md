# Playwright UI and API integration tests

**Goal:** Exercise the real running Questify app through browsers, HTTP APIs and
Socket.IO while persisting only to local disposable services.

## Environment
- Playwright Test, Chromium desktop/mobile and Firefox projects.
- Real Firestore emulator using project `demo-questify-e2e`, bound to localhost.
- Minimal local S3 HTTP fixture for upload/proxy/download integration.
- Production app build isolated in `.next-e2e`, application port 3210, emulator
  port 8088, and S3 port 4569. Never reuse an existing server implicitly.
- The stack runner constructs a minimal environment, explicitly masks production
  credential aliases before Next.js loads .env.local, and owns child cleanup.
- No testing-only routes or authentication bypasses in application code.

## Test scope
- Public pages, assets, mobile layout and browser console/runtime errors.
- Real signup, logout, login, bad credentials and tampered/unsigned cookies.
- UI create/edit/publish/reorder/delete mixed decks; confirm persisted results by API.
- API CRUD, validation, foreign-owner requests, malformed bodies and unauthenticated requests.
- Media upload via UI, signed proxy round trip, invalid keys.
- Multiple browser contexts for host, display and participants; content pacing,
  answers, pause/resume, reload/rejoin, ending and analytics persistence.
- Browser accessibility names on key editor/join controls.

## Files and implementation
- `playwright.config.ts`: isolated webServer and browser/API project matrix.
- `tests/e2e/start-stack.cjs`: emulator/storage/build/app lifecycle and strict localhost configuration.
- `tests/e2e/emulator.cjs`, `firestore.rules`: pinned official emulator and local rules.
- `tests/e2e/helpers.ts`: browser-created users, test-owned deck fixtures, clean contexts.
- `tests/e2e/{auth,editor,live,api}.spec.ts`: observable behavior assertions.
- `lib/r2.ts`/media route: shared configurable S3 endpoint for the storage boundary.
- `next.config.mjs`: explicit build-directory override with current defaults preserved.

Write acceptance tests before fixing issues they expose. Keep the existing Node
regression suite. Run the full browser/API matrix, then unit tests, production
build/typecheck sequentially, dependency audit and staged-diff checks. Record
actual test counts, any excluded external-provider behavior, and discovered fixes.
Obtain independent source review, commit on `feature/playwright-e2e`, merge into dev.

These tests cover implemented functionality, not all 177 planned features. Local
S3 verifies the app's storage contract, not Cloudflare account permissions or CDN setup.
