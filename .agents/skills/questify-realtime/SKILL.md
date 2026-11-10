---
name: questify-realtime
description: Change or debug Questify Socket.IO events, room lifecycle, game phases, timers, scoring and multiplayer reconnect behavior.
---

# Questify realtime gameplay

Read server.js, server/game-server.js and all consumers of the affected event in app/present/[id],
app/display/[id], app/join and app/room. Event payloads are not uniform: some accept
room strings and others objects. Search every emitter and listener before changes.

Treat runGame and DURATIONS in server/game-server.js as the active phase engine. Do not substitute
the simplified README phase model or assume app/config/game.ts controls all timers.
Keep room membership, host authorization, answer timing and scoring on the server.
Inspect current validation; do not assume the existing protocol is authenticated.
Never expose correct answers to participants before the intended result phase.

When changing transitions, cover pause/resume, host advance, end-game, disconnect,
room cleanup and cancellation. Ensure old timers cannot advance a restarted room.
Check duplicate answers and late submissions. Preserve stable player identity on
reconnect where supported and distinguish that from ephemeral socket IDs.

createGameServer stores rooms in process memory. Do not claim persistence across restarts
or multi-instance support without adding and verifying appropriate coordination.
Session writes belong to the game server and use idempotent document creation in
lib/firebase-admin.js. Client-submitted analytics are rejected. Preserve that boundary.

Run node --check server.js, TypeScript/build checks for client changes, and a smoke
session with a host, display and two participants using npm run dev. Exercise the
changed edge case and report what was actually tested. Prefer deterministic regression
coverage for scoring and lifecycle bugs when suitable test infrastructure exists.
