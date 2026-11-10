# Questify full platform implementation plan

> For agentic workers: implement one reviewed vertical slice at a time. Use the
> installed Questify domain skills, systematic-debugging, test-driven-development,
> verification-before-completion and requesting-code-review as applicable. The
> user has authorized the current repo review/fixes and requested this roadmap;
> this document does not itself authorize deployment, remote pushes or purchases.

**Goal:** Deliver the complete tracked Questify feature inventory through verified
releases, combining live games, interactive presentations and asynchronous learning.

**Architecture:** Evolve the existing Next.js/React UI, custom Socket.IO server,
Firestore persistence and R2 media services. Introduce a shared activity registry,
versioned content and response contracts before adding types. Keep game authority
server-side; add durable state and background processing as scale requires them.

**Tech stack:** Current Next.js 14/React 18/TypeScript, Node custom server,
Socket.IO, Firebase Admin/Firestore and S3-compatible R2. Runtime work currently
targets Node 24+. P0 must assess supported dependency versions before choosing a
framework migration; do not prescribe incompatible React 19 APIs to React 18 code.

**Spec:** [Complete product inventory](../../PRODUCT_ROADMAP.md).
**Existing fix plan:** [Skill audit fixes](2026-11-10-skill-audit-fixes.md).

## Global constraints
- Preserve current quiz data, user accounts and uncommitted audit changes.
- Start feature/fix branches from latest verified `dev`; integrate tested changes
  into `dev`. Update `main` only for a deliberately selected release.
- No live Firebase/R2 write fixtures. Use emulators, disposable stores and test buckets.
- No push, deployment, external invitations, paid AI calls or billing activation
  merely because a feature appears in this plan.
- Accessibility, privacy, grading integrity and reconnect behavior are requirements
  for each feature, not cleanup postponed until the final release.
- No completion claims based only on UI presence or compilation.

## Review focus
1. Mixed scored/unscored activities must not share accidental grading assumptions.
2. Anonymous responses must not expose identities through sockets, reports or exports.
3. Disconnect/retry/restart must not duplicate answers, scores, charges or session records.
4. Editing published content must not alter an active session's answer key.
5. Existing quizzes and reports must survive versioned schema migrations.

## Delivery approach and completion standard
This is a program plan covering all inventory IDs. Only the immediate work is
implementation-ready. Before starting each later slice, write a short spec and
an executable task plan with exact interfaces, files, failing tests and migration
steps. Do not invent provider-specific APIs or lock large schemas months ahead.

For every slice:
- [ ] Select inventory IDs and define the smallest usable end-to-end workflow.
- [ ] Write observable acceptance tests and run them to establish the failing case.
- [ ] Implement schema validation, persistence, server behavior, editor, participant,
  presenter/display behavior and reports affected by that workflow.
- [ ] Test invalid inputs, unauthorized access, keyboard use, loading/error states,
  reconnect and duplicate delivery. Run relevant regression tests and build checks.
- [ ] Obtain independent review, address important findings, commit focused changes
  and merge into dev using the authorized workflow.
- [ ] Record evidence and update feature status. Keep unfinished IDs explicitly open.

## Release sequence

| Release | Workstreams | Usable outcome |
| --- | --- | --- |
| R0 | P0 | Reliable existing app with dependency/security/build regressions resolved |
| R1 | P1, P2, P3 core, P4 core | Mixed live deck with an improved editor, quiz, poll, word cloud, text and Q&A |
| R2 | Remaining P3, P4, P5, P6, P12 | Broader quiz/gameplay and full interactive presentation workflows |
| R3 | P7, P8, P9 | Self-paced assignments/surveys, courses and useful reporting |
| R4 | P10, P11, P13, P14 | Shared workspaces, AI assistance, integrations and measured production scale |
| R5 | P15 if selected | Commercial plans and billing |

P9 reports and P12 media evolve alongside earlier releases. P14 reliability,
security and accessibility checks apply continuously; advanced scale/admin features
have their own later delivery gate. Integrations can be reordered after their
identity, permissions and content dependencies are available.

## Immediate task: finish P0 before new features
Files: existing audit changes in app/, lib/, server/, server.js, package.json,
next.config.mjs, Dockerfile, render.yaml, .env.example and tests/.

Current evidence: the earlier analytics JSX and cross-owner update failures were
reproduced; session/validation/editor/realtime tests were added; a production build
passed before the latest edits. Final review, a fresh full verification run,
dependency remediation, browser checks and integration into dev remain unfinished.
Do not report the current branch as complete or overwrite its private .env.local.

- [ ] Rerun `npm test`, `npm run typecheck`, `node --check server.js`,
  `node --check server/game-server.js` and `npm run build` after final changes.
- [ ] Recheck the new config test with unset/development/production NODE_ENV;
  dev must use `.next-dev`, production must use `.next`.
- [ ] Verify signup with an email-style username, configured-session preflight,
  existing-user login, analytics identity lookup and cross-owner write rejection.
- [ ] Verify one host, one display and two participants across reconnect, late join,
  pause/resume, end/restart, typed answers and analytics persistence using fixtures.
- [ ] Remediate the dependency advisory baseline using compatible fixes first;
  specify/test a supported framework migration if required. Do not force-fix blindly.
- [ ] Update README/agent guidance to reflect actual commands and architecture;
  commit, review and merge the finished audit into dev before feature branches.

## Workstream plans

### P0: Reliable foundation

**Scope:** BASE-01 through BASE-10.

**Depends on:** None; complete the current audit first.

**File boundaries:** Existing app/, lib/, server/, tests/ and deployment/configuration files.

**Release gate:** All BASE IDs verified; production build and regression suite pass; fresh dependency audit has no untriaged critical/high findings; service/browser limitations documented.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P1: Shared content and response model

**Scope:** MODEL-01 through MODEL-07.

**Depends on:** P0.

**File boundaries:** Create lib/activities/types.ts, lib/activities/registry.ts, lib/activities/validation.ts and lib/presentations.ts; extend lib/db.ts and server/game-server.js with versioned adapters.

**Release gate:** A legacy quiz migrates without losing answers, types or reports; a published mixed deck can start from an immutable version; public payloads never carry answer keys or private participant fields.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P2: Authoring and content management

**Scope:** EDIT-01 through EDIT-12.

**Depends on:** P1; build incrementally alongside P3.

**File boundaries:** Evolve app/components/QuizEditor.tsx into an activity editor with app/components/editor/*; add import/export and version history boundaries under lib/presentations/.

**Release gate:** Create/edit/reorder/duplicate/undo a mixed deck; reload recovers autosaved changes; concurrent edits cannot silently overwrite work; malformed imports produce actionable row-level errors.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P3: Question and interaction types

**Scope:** QUESTION-01 through QUESTION-24.

**Depends on:** P1 and a minimal P2 editor; integrate P4/P6/P9 for each type.

**File boundaries:** One module per type under lib/activities/ plus editor/player/result renderers under app/components/activities/. Keep type-specific grading and aggregation testable outside React.

**Release gate:** Every QUESTION ID has validation and its editor→publish→join→respond→aggregate→report flow tested; polls never score; typed answer keys are not disclosed; multi-select and tolerance grading use documented rules.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P4: Hosting and participant experience

**Scope:** LIVE-01 through LIVE-17.

**Depends on:** P1, P3 initial types; P0 realtime correctness.

**File boundaries:** server/game-server.js, app/present/[id], app/display/[id], app/join, app/components/presenter/* and membership/role services.

**Release gate:** Host, moderator, display and multiple participants retain correct role/state across reconnect; locking/removing/late joining obey policy; host pacing/result visibility work without hidden client authority.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P5: Quiz scoring and game modes

**Scope:** GAME-01 through GAME-12.

**Depends on:** P3 scored types and P4 stable sessions.

**File boundaries:** Create lib/scoring/* and server/modes/*; evolve participant/team persistence, presenter controls and reports.

**Release gate:** Deterministic scoring fixtures cover speed/accuracy/partial credit/ties; shuffled answers still grade correctly; team aggregation and disconnect behavior are explicit and tested.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P6: Presentation and audience insight

**Scope:** PRESENT-01 through PRESENT-12.

**Depends on:** P1, P3 unscored types and P4 moderation roles.

**File boundaries:** Content-slide renderers, result visualizations and Q&A/moderation services under app/components/activities and lib/activities.

**Release gate:** A mixed workshop runs with content, polls, scales, brainstorm and moderated Q&A; hidden results stay hidden; anonymous segmentation obeys minimum-group thresholds; comparisons use the correct question/session IDs.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P7: Self-paced surveys and assignments

**Scope:** ASYNC-01 through ASYNC-10.

**Depends on:** P1 published versions, P3 response validation, P9 report foundations.

**File boundaries:** Create app/assignments/*, app/respond/[id]/* and lib/assignments/*; add durable jobs for schedules/reminders.

**Release gate:** Assignment links enforce schedules/attempts; participant resumes correctly; branching excludes hidden questions from required validation; reminder jobs deduplicate; recurring trends distinguish question revisions.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P8: Learning and training

**Scope:** LEARN-01 through LEARN-08.

**Depends on:** P7, P9 and identified learner permissions.

**File boundaries:** Create app/courses/*, app/learn/* and lib/courses/*; extend cohort and completion/report models.

**Release gate:** A learner completes prerequisites, resumes progress and earns a certificate only when criteria pass; retakes and version changes do not corrupt progress; instructors cannot read other cohorts.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P9: Results and analytics

**Scope:** REPORT-01 through REPORT-12.

**Depends on:** P1 normalized responses; grow with each new mode/type.

**File boundaries:** Extend app/dashboard/analytics, create app/reports/[id]/* and lib/reports/*; exports use background jobs and expiring downloads.

**Release gate:** Report totals reconcile with persisted responses; all interaction types export consistently; anonymity survives export; access control, timezone handling and CSV formula injection are tested.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P10: Libraries, collaboration and sharing

**Scope:** TEAM-01 through TEAM-10.

**Depends on:** P1 ownership/versioning, P2 editor and P9 scoped reports.

**File boundaries:** Create lib/workspaces/* and app/workspaces/*; introduce workspace-scoped queries/roles before realtime co-editing or public discovery.

**Release gate:** Cross-workspace access tests fail closed; shared content survives member removal; concurrent editing has deterministic conflict recovery; public remixes honor permissions and attribution.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P11: Assisted creation and insight

**Scope:** AI-01 through AI-08.

**Depends on:** P1/P2 content contracts; P6 text-response contracts; P10 scoped permissions where shared.

**File boundaries:** Create lib/ai/* provider adapters and background job workflows; keep generated content in draft until reviewed.

**Release gate:** AI results are schema-validated, editable and attributable; provider failure is recoverable; private responses require explicit handling; quotas and retries cannot cause duplicate paid work.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P12: Media and branding

**Scope:** MEDIA-01 through MEDIA-09.

**Depends on:** P0 upload safety, P1 activity schemas; expand alongside P2–P6.

**File boundaries:** lib/r2.ts, media routes, media library metadata, app/components/game/QuestionMedia.tsx and theme/localization components.

**Release gate:** Image/audio/video round trips work on supported devices; reused media is not deleted; captions/alt text and mute controls work; localization preserves activity identity and grading.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P13: External integrations

**Scope:** INTEGRATE-01 through INTEGRATE-08.

**Depends on:** P1 published versions, P10 roles; P7/P8 for learning integrations.

**File boundaries:** Create lib/integrations/* per provider, scoped API endpoints and signed webhook delivery workers.

**Release gate:** Each integration has a separate tested release; revocation, scopes, retry deduplication and provider failures are covered; LMS grade return cannot expose another learner or course.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P14: Scale, administration and privacy

**Scope:** OPS-01 through OPS-12.

**Depends on:** P0 immediately; P1/P4 contracts before distributed state; P10 for enterprise identity.

**File boundaries:** Server state adapters, durable jobs, health routes, load harnesses and admin UI; add shared coordination/storage only with measured requirements.

**Release gate:** Restart/redeploy does not lose active sessions; cross-instance delivery is consistent; published load targets are measured; backup restoration, retention deletion, SSO and accessibility are verified.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

### P15: Optional commercial product layer

**Scope:** BUSINESS-01 through BUSINESS-06.

**Depends on:** Explicit monetization choice; P10 tenant/seat identity and P14 jobs/audit.

**File boundaries:** Create lib/billing/* and account billing UI with provider adapters and entitlement checks at service boundaries.

**Release gate:** Use provider sandbox first; duplicate/out-of-order payment events do not duplicate charges or entitlements; downgrade/refund/cancellation behavior and usage limits are tested.

- [ ] Break this scope into independently reviewable vertical slices before implementation.
- [ ] Implement and verify every tracked feature ID; record migration and test evidence.
- [ ] Review, commit and integrate completed slices into dev; retain open IDs.

## First feature slices after P0
1. P1 schema/legacy adapter and immutable published deck snapshot.
2. P2 minimal mixed-deck editor: text slide + existing single-choice quiz + poll.
3. Word cloud: bounded text responses, aggregation, live result, moderation and report.
4. Open-text response wall and moderation.
5. Q&A with upvotes, moderator queue and answered state.
6. Multi-select and scale/ranking interactions; then expand the remaining type catalog.

These first slices establish both quiz competition and audience-engagement workflows.
Do not start AI, payments or branded game modes before these foundations work.

## Decisions to settle at the relevant phase
- Primary launch audience: classrooms, workplace meetings, public events, or a
  deliberate combination; use this to order templates and advanced modes.
- Data residency, retention and consent expectations before recurring surveys,
  identity-linked analytics and enterprise rollout.
- Actual participant/concurrency targets before choosing distributed room storage.
- Initial integrations, AI provider/budget, and monetization before external accounts
  or paid services are enabled.

These decisions do not block finishing the current audit or specifying the shared
activity model. They should not become an excuse to build every integration at once.

## Progress ledger
| Item | State | Evidence / next action |
| --- | --- | --- |
| Competitor/source research | Recorded | Official references in product inventory |
| Feature inventory | Draft recorded | All IDs grouped into P0–P15 |
| Program delivery plan | Draft recorded | Release gates and dependencies above |
| Existing audit fixes | In progress, uncommitted | fix/skill-audit; finish P0 verification/remediation |
| Full feature implementation | Not started | Begin only after the foundation gate |

No calendar promises are attached to this scope. Estimate each slice after its
acceptance tests, migrations and provider dependencies are specified. Track releases
by verified behavior instead of an arbitrary promise to implement everything at once.
