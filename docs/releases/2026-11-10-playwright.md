# Playwright integration verification — 2026-11-10

Questify now has Playwright Test with desktop Chromium, desktop Firefox, mobile
Chromium and a dedicated API project. The real production app runs against the
official Firestore emulator and a small local S3 transport fixture. No live cloud
fixtures, authentication bypasses or test-only application routes are used.

Changes include isolated `.next-e2e` builds, a shared configurable storage client
for upload/download integration, signed-media configuration validation, dependency
and browser installation commands, failure artifacts, and GitHub Actions CI.

Observed verification:

- `npm run test:e2e`: **22 passed**, no retries or skipped tests (about 1.3 minutes).
- `npm test`: **38 passed**, including environment isolation and R2 configuration regressions.
- `npm audit --json`: **0 vulnerabilities**, including dev dependencies.
- `npm run build`, `npm run typecheck`, `node --check server.js`, and
  `git diff --check`: passed.
- Independent source review: configuration, isolation and mobile-context findings fixed;
  final review reports no blocking defects.

Browser checks cover signup/login/logout, route guards, assets, editor validation,
all current activity types in mixed decks, publication and stable IDs, ordering,
edit/delete, media upload/download/removal, multi-context live gameplay, slides,
pause/resume, correct/incorrect answers, reload/rejoin, poll feedback and persisted
analytics. API checks cover CRUD, publication, malformed/invalid input, foreign
ownership, missing/forged authentication, media keys and rejected client analytics.

Firestore emulator 1.22.0 is checksum pinned. The storage fixture checks SDK upload,
proxy/signing and byte retrieval; provider permissions, signature authorization,
Cloudflare CDN and real-service availability need separate provider integration
checks. Presenter controls use a desktop viewport; participants use the project's
device configuration. Guest contexts do not retain their own videos/traces.
The CI workflow is configured locally and has not yet executed on GitHub.

Setup and diagnostic commands: [Testing Questify](../TESTING.md).
