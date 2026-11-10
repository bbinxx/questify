# First implementation milestone: mixed presentations

## Delivered
- Mixed text slides, existing quiz types and unscored polls in one presentation.
- Shared activity registry and schema-v1 contracts, retaining legacy quiz reads.
- Stable activity IDs, keyboard-accessible Move up/down, and a shared create/edit UI.
- Save & publish atomically creates immutable Firestore versions. Active rooms pin
  their loaded version, which is retained in their session report.
- Text content appears on host, display and participant screens until host advance.
- Polls have neutral results, no competitive phases or correctness totals, and
  response distributions in reports. Content-only/poll-only decks have no podium.
- Foundation fixes: signed sessions, resource ownership, validated uploads and nested
  media URLs, authenticated host claims, answer redaction, reconnect restoration,
  end/restart cancellation and working pause/resume.
- Patched Next.js 16.4.6, React 19.3.1, Firebase Admin 14.5.0 and Node 24+ setup.
  Unused browser Firebase/jose/native-only dependencies and legacy Redis/Prisma
  setup were removed. Development/build directories are separate.

## Verification
- `npm test`: 34 passing tests, including actual local Socket.IO connections with
  host, display and two participants, publication transactions, legacy fallback,
  editor round trips/reordering, session tampering, ownership and component rendering.
- The installed Firestore SDK is used offline to check real document-reference
  semantics; disposable adapters handle transaction tests without network writes.
- `npm run typecheck` and `npm run build`: passed with all routes present.
- `node --check server.js` and `node --check server/game-server.js`: passed.
- `npm audit --json`: zero reported advisories across the installed dependency tree.
- Anonymous production HTTP smoke checks: home/join/login/signup, login redirects
  for protected routes, unauthorized API access, invalid media key handling, and
  rejection of anonymous Socket.IO host claims. All 14 referenced CSS/JS assets
  returned 200. Next.js streamed login redirects are handled as redirects rather
  than incorrectly treating their HTTP 200 transport status as authorization.
- Headless Firefox: mobile join page rendered at 390 × 844 and was visually checked.
- Independent source review found and prompted fixes for repeated-join answer
  resets, missing editor answer slots, Firestore creation semantics and slide overflow.

## Limits and follow-up
No live user collections or storage buckets were used as write fixtures. A full
logged-in browser create/publish/host flow against disposable Firebase/R2 resources,
and building/running the Docker image, remain unverified. Socket.IO and publication
contracts are covered by the tests described above.

Sessions still run in one Node process and are not recovered after restart. Account
recovery, persistent throttling, durable analytics retries, autosave/drafts, additional
activity types and the rest of the product roadmap remain separate work.

Restart an existing development server after installing the updated dependencies.
Use Node 24+, `npm ci`, then `npm run dev`. Signed sessions require a private
`SESSION_SECRET` with at least 32 bytes; previously unsigned login cookies are retired.

Next feature slice: live word cloud creation, response aggregation, moderation,
display and report support using the activity contracts established here.
