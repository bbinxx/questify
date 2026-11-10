# Questify

Live quizzes and interactive presentations built with Next.js 16, React 19,
TypeScript, Socket.IO, Firebase Admin/Firestore and Cloudflare R2.

## Development

Use Node.js 24 or later and npm. Install dependencies with `npm ci`, copy
`.env.example` to `.env.local`, and configure the values described there.
Generate a private session secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set that value as `SESSION_SECRET`. Keep service account JSON and storage keys
out of Git. Existing unsigned login cookies are rejected; log in again after
upgrading. Host usernames may be email-style names.

```sh
npm run dev       # Custom HTTP + Socket.IO server, normally port 3000
npm test          # Regression tests using disposable adapters/local sockets
npm run build     # Production build
npm run typecheck # Run after the build, not concurrently with it
npm start         # Production custom server
npm run smoke     # Anonymous page/asset/socket checks against localhost:3000
```

Development uses `.next-dev`; production uses `.next`, preventing build output
from corrupting a running development server. `npm run dev:next` runs only Next.js
and does not start Socket.IO gameplay. The custom server needs a long-lived Node
process; deployment runs `node server.js`, not the generated standalone server.

## Application paths

- `/`: home; `/signup` and `/login`: host accounts.
- `/dashboard`: saved library; `/create` and `/edit/[id]`: editor.
- `/present/[quizId]`: host controls; `/display/[roomCode]`: audience display.
- `/join`: participant entry; `/dashboard/analytics`: completed session results.

Quiz/user persistence is centralized through `lib/db.ts`. Host sessions are signed
and expire; protected actions verify identity and ownership. The authoritative
Socket.IO engine is in `server/game-server.js`. It loads quiz content server-side,
keeps answer keys out of pre-result payloads and writes session analytics itself.
Media uploads accept supported images/videos up to 20 MB and use nested R2 keys.

Rooms currently live in one process. A process restart ends those rooms; durable
recovery and multi-instance coordination remain roadmap work. Tests do not write
fixtures into live Firestore collections or R2 buckets. Deployment and real-service
verification require separately configured disposable resources.

## Mixed presentations: first milestone

Choose **Text slide** in the editor's Activity type menu to add an introduction,
explanation or closing slide. Text slides can sit alongside quizzes and polls.
Use **Move up / Move down** to reorder the selected activity without changing its
identity. **Save & publish** creates an immutable published version; publishing an
edit does not replace the content already loaded in an active room.

Text slides stay on presenter, display and participant screens until the host
advances. They have no timer or scoring. Poll results are neutral and are excluded
from quiz accuracy, with response totals shown in session reports. Existing saved
quizzes remain readable. Autosave, independent drafts, word clouds and Q&A are
not part of this first slice.

See [milestone verification](docs/releases/2026-11-10-mixed-presentations.md).

## Product direction

- [Full feature inventory](docs/PRODUCT_ROADMAP.md)
- [Phased implementation plan](docs/superpowers/plans/2026-11-10-full-platform.md)
- [First mixed-presentation slice](docs/superpowers/plans/2026-11-10-mixed-presentations.md)
- [Repository agent guidance](AGENTS.md)
