# Mixed presentations: first feature slice

**Goal:** Author and run text slides, existing quizzes and unscored polls in one deck.
**Spec:** PRODUCT_ROADMAP.md MODEL-01/02/04/07, PRESENT-01 (text only), EDIT-02
(keyboard reordering), with existing QUESTION types preserved.

Keep the existing quiz routes for compatibility. Save publishes an immutable version
atomically and is labelled **Save & publish**. Separate drafts/autosave, drag sorting,
word clouds, Q&A and other question types remain later slices. Do not claim all of
P1/P2/P3 is complete. Apply the supported dependency versions established by P0.

## Data and file boundaries
- `lib/activities/registry.js`: supported type metadata (`kind`, `scored`, `label`).
- `lib/activities/types.ts`: persisted activity union and public snapshot contracts.
- `lib/validation.js`: `normalizeQuiz(title, questions)` retains the legacy signature;
  returns schema-v1 compatible activities, stable IDs and safe text-slide body data.
- `lib/presentations.js`: transaction-based publication and version loading. Existing
  `games/{id}` documents stay readable; immutable versions live below
  `games/{id}/versions/{versionId}`. New publication never edits a previous version.
- `lib/db.ts`: create/update/get use that boundary. Authorization is checked before
  publication and repeated in the transaction for updates.
- `lib/editor.js`: preserve stable activity IDs/body and pad editable answer slots;
  expose immutable reordering without changing the selected activity identity.
- `server/game-server.js`: load published content once per room, retain version ID
  in reports, and introduce `CONTENT` state. Text slides wait for host advance/end;
  they have no timer, answer input, grading or correctness statistics. Polls are
  unscored and skip correctness feedback/competitive phases.
- `app/components/QuizEditor.tsx`: add type picker/text body input/reorder controls;
  distinguish content settings from quiz settings and keep all existing types editable.
- `app/components/activities/ContentSlide.tsx`: shared accessible content view used by
  presenter, display and participant. Plain text with preserved line breaks; no HTML.

## Tests and implementation order
- [x] Write failing registry/normalization tests for mixed decks, duplicate IDs,
  body bounds, stable reorder IDs and legacy quiz/typed/poll round trips.
- [x] Run tests to establish failures; implement metadata and canonical adapters.
- [x] Write failing transaction tests: first publish, new version, old version intact,
  foreign-host update rejection, missing version rejection and legacy fallback.
- [x] Implement publication and route/service integration; run the regression suite.
- [x] Write Socket.IO tests with a host, display and two participants: CONTENT holds,
  answer submissions are ignored, reconnect restores slide content, host advance
  reaches the next question, live source changes cannot alter the room's version,
  text slides/polls do not inflate accuracy or score, and end cancels the run.
- [x] Implement runtime changes, then editor and shared role-specific views.
- [x] Verify UI semantics with server-rendered component tests; run typecheck and
  production build sequentially, then HTTP/page-asset smoke checks.
- [x] Request independent review, address important findings, commit on
  `feature/mixed-presentations`, merge into dev and update the feature ledger.

## Acceptance workflow
Create a deck: introductory text → multiple-choice quiz → poll → concluding text.
Save & publish, reopen it, reorder without losing content, host it, join from a
display and two participants, respond and reconnect. All roles see content slides;
only the host advances them. Results distinguish scored questions from polls and
content. Publishing another edit leaves the active room's content/version unchanged.

External Firebase/R2 writes need disposable test resources. A fake Firestore adapter
and real localhost Socket.IO clients verify the contracts without touching user data.

## Verification
See [the milestone release note](../../releases/2026-11-10-mixed-presentations.md) for
commands, checks and external-resource limitations. No live Firestore/R2 fixtures
were created. Full logged-in browser flows and a Docker image build remain unverified.
