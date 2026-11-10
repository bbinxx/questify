# Questify skill audit fixes implementation plan

> Implementation authorized by the user; audit fixes are in progress on fix/skill-audit.
> This plan covers the foundation workstream in [the full platform plan](2026-11-10-full-platform.md).
> Execute task by task. Use the installed debugging, testing,
> verification and Questify domain skills; preserve the user's branch-to-dev workflow.

**Goal:** Fix confirmed build, access-control, media, multiplayer and UI defects.

**Architecture:** Keep Next.js 14/React 18 and the custom Socket.IO server. Retain
DatabaseService as the persistence boundary. Add shared session validation and
small testable gameplay helpers rather than rewriting the application.

**Spec:** User request: “fix all based on skills”; AGENTS.md and repo domain skills.

## Constraints and baseline
- No production-data test writes, deployment, or push without authorization.
- Commit on fix branches, verify, merge completed fixes into dev.
- Existing TypeScript baseline fails in app/dashboard/analytics/page.tsx:73,136.
- node --check server.js passes; syntax checks do not establish gameplay correctness.
- Use Node's built-in test runner where possible; introduce TS test tooling only
  if required for meaningful route/action tests, with a matching lockfile update.

## Review focus
Forged cookies and cross-user game IDs must fail closed. Nested media keys must
resolve without permitting arbitrary object access. End/restart must cancel prior
game loops. Reconnect must retain player state. Tests must not access live Firebase/R2.

## Task 1: Restore build and remove obsolete setup
Files: app/dashboard/analytics/page.tsx, lib/redis.ts, package.json,
package-lock.json if needed, render.yaml, README.md.
- [ ] Reproduce analytics JSX errors with tsc; add a route-render regression check.
- [ ] Fix malformed conditional JSX, remove the username lookup using a user ID,
  and wire logout controls to the existing action.
- [ ] Remove unused Redis module after verifying no consumers; remove absent-Prisma
  scripts and align deployment variables with current Firestore/R2 source.
- [ ] Run tsc, server syntax check and build; investigate additional baseline failures.
- [ ] Commit the verified build/setup fix independently.

## Task 2: Sessions and protected writes
Files: new lib/session.ts (shared verified identity), app/actions/auth.ts,
app/actions/quiz.ts, app/actions/upload.ts, app/dashboard/page.tsx,
app/dashboard/analytics/page.tsx, app/api/sessions/route.ts, app/api/quiz/route.ts,
.env.example and regression tests.
- [ ] Write failing tests for forged/expired sessions, absent signing configuration,
  cross-owner quiz updates/deletes and session writes for someone else's game.
- [ ] Replace trusted raw userId cookies with signed expiring sessions shared between Next.js and the custom server; invalidate old unsigned cookies and require login again.
- [ ] Verify identity in every protected entrypoint; enforce ownership before writes.
- [ ] Validate request shapes, question indices/options/timing and bounded inputs.
- [ ] Replace unauthenticated in-memory quiz CRUD with authenticated persisted
  behavior or retire it only after confirming it has no consumers.
- [ ] Run tests against disposable adapters, typecheck/build, and commit.

## Task 3: Media round trip
Files: app/actions/upload.ts, lib/r2.ts,
app/api/media/[key]/route.ts moved to app/api/media/[...key]/route.ts,
app/create/page.tsx, app/edit/[id]/page.tsx, next.config.mjs if body limits change.
- [ ] Write failing tests for nested keys, encoded path segments, traversal,
  missing files, unsupported MIME types, oversized files and storage failure.
- [ ] Add bounded image/video validation, align action body limits, safely construct
  nested keys/URLs, and preserve media playback for public game participants.
- [ ] Verify proxy redirects and sanitized errors with a fake storage signer;
  verify the real service only with a disposable bucket if configured.
- [ ] Run regression/type/build checks and commit.

## Task 4: Multiplayer integrity and lifecycle
Files: server.js, extracted server helpers if needed, app/present/[id]/page.tsx,
app/display/[id]/page.tsx, app/join/page.tsx, app/room/page.tsx, realtime tests.
- [ ] Add failing Socket.IO tests for unauthorized host takeover, malformed payloads,
  invalid room joins/answers, answer secrecy, reconnect, end/restart and pause/resume.
- [ ] Authenticate host claims with verified identity and persisted game ownership;
  reject unhosted room joins instead of creating phantom rooms.
- [ ] Send participant-safe question payloads without correctness flags before results.
- [ ] Separate phase skipping from whole-run cancellation; ensure pause changes
  deadlines and old loops/timer races terminate after end, restart and cleanup.
- [ ] Persist reconnect identity client-side; rejoin on connection, restore phase
  snapshots, and cancel join timeout after acknowledgment.
- [ ] Consolidate session persistence to one authoritative, idempotent path.
- [ ] Run deterministic tests and host/display/two-participant smoke verification;
  cover duplicate and late submissions; commit.

## Task 5: UI/accessibility and final review
Files: affected app pages/components, app/globals.css, app/layout.tsx,
repo skill guidance and audit documentation when resolved findings change it.
- [ ] Review against current web-design-guidelines and applicable Vercel rules.
- [ ] Fix input labels, keyboard interactions, icon button names, focus visibility,
  asynchronous error announcements and reduced-motion behavior found in the review.
- [ ] Preserve current visual identity; avoid speculative redesign and React 19 APIs.
- [ ] Verify mobile/desktop routes, empty/error states and game layouts; document
  unavailable browser/service checks instead of claiming they passed.
- [ ] Run complete regression suite, tsc, server syntax check, production build and
  staged diff check. Review final diff and merge verified commits into dev.

## Completion boundary
Report fixed issues, test results and remaining limitations separately. “All fixed”
requires evidence for the audited scope; external-service and visual checks remain
explicitly incomplete if the required runtime or test credentials are unavailable.
