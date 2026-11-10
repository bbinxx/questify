# Questify repository guidance

## Project map
Questify is a multiplayer quiz app using Next.js 14 App Router, React 18,
TypeScript, Tailwind CSS 4, Framer Motion, and a CommonJS Socket.IO custom server.
Read package.json and the affected source before using README examples; some are stale.

- app/: routes, UI, server actions, API handlers, game configuration and audio.
- server.js: authoritative room state, timers, scoring, Socket.IO events and session persistence.
- lib/db.ts: DatabaseService backed by Firestore; lib/firebase.ts initializes Admin SDK.
- lib/r2.ts and app/api/media/[key]/route.ts: media storage and retrieval.
- Dockerfile, render.yaml, next.config.mjs: deployment with a custom Node server.

## Select skills by task
Read only the relevant repo skill:

| Work | Skill |
| --- | --- |
| Routes, React UI, styling, accessibility | .agents/skills/questify-web/SKILL.md |
| Socket events, game phases, scoring, reconnects | .agents/skills/questify-realtime/SKILL.md |
| Firestore, authentication, server actions, uploads, deployment | .agents/skills/questify-backend/SKILL.md |
| Branches, commits, merges, worktrees, cleanup | .agents/skills/questify-git/SKILL.md |

Use these global skills when the task benefits from them:
- systematic-debugging for bugs; verification-before-completion before completion claims.
- writing-plans for complex changes; test-driven-development for behavior needing tests.
- requesting-code-review before integration; using-git-worktrees when isolation is needed.
- find-skills for missing capabilities.
- vercel-react-best-practices for React/Next.js performance.
- web-design-guidelines for UI/accessibility reviews.
- vercel-composition-patterns for component architecture.
- frontend-design for visual design work.

Apply global web rules within React 18 and Next.js 14 compatibility. Skip React 19
and newer Next.js APIs unless an upgrade is explicitly part of the task.
Implement changes on a focused feature/fix branch (use docs/chore where appropriate),
verify and commit them, then integrate into dev when authorized. Branch names alone
do not authorize publishing to origin.

The installed-skill audit and remaining gaps are in .codex/skills-review.md.
Android/Kotlin/Compose skills do not apply to this web repository.

## Development and verification
Use npm and package-lock.json. Use npm ci when dependencies need installation.
npm run dev starts the custom server; npm run dev:next omits Socket.IO.
For application changes, run node_modules/.bin/tsc --noEmit and npm run build
when dependencies are available. For server changes, also run node --check server.js
and exercise relevant multiplayer behavior using the custom server.
There are currently no test or lint scripts. Do not report them as passing or
introduce a test framework for a documentation-only change. Record actual commands,
failures and external-service limitations. Use git diff --check for documentation.

## Boundaries
Keep Firebase Admin and R2 credentials on the server. Do not print .env contents.
Use DatabaseService for persisted quiz/user work; verify legacy API consumers
before consolidating storage. Preserve server-authoritative game decisions.
Do not run legacy db:prod:* scripts: they reference absent Prisma tooling/schema.
lib/redis.ts imports ioredis, which is absent from package.json; verify consumers
before restoring or removing it. Do not silently treat Redis as the active game store.

## Git
Use main as the integration branch and dev as the current development branch.
dev was recreated from the latest dev_alt tip; keep dev_alt until explicitly retired.
Inspect current branch, worktree, diff and upstream before Git mutations. Choose the
base from task context; do not reset dev to main or discard unpublished commits.
Use focused feat/, fix/, docs/ or chore/ branches for new isolated work when useful;
work in the current checkout for routine requested edits unless isolation is needed.
Commit only task-owned files, with a concise message describing the actual change.
Respect existing authorization for commits, pushes and merges; do not infer permission
to publish or delete remote branches from a local cleanup request.
