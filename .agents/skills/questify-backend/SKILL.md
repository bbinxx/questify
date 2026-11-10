---
name: questify-backend
description: Develop or review Questify Firestore persistence, server-side authentication, quiz actions, R2 media handling and custom-server deployment.
---

# Questify backend and media

Follow callers through app/actions, app/api, lib/db.ts and lib/firebase.ts.
DatabaseService is the current persistence boundary. The /api/quiz handler has
separate in-memory storage: inspect its callers rather than assuming parity with
Firestore. Preserve serialized question options and timestamp contracts when mapping.

Authentication currently uses bcrypt and a userId cookie. Firebase Admin bypasses
client security rules; authorization must be checked in trusted application code.
Cookie presence alone does not prove identity or ownership. When changing auth or
protected writes, verify session integrity, game ownership and unauthorized behavior.
Do not represent current code as secure merely because this skill describes checks.

For media changes inspect app/actions/upload.ts, lib/r2.ts and
app/api/media/[key]/route.ts together. Upload keys include nested media/user paths;
check dynamic route handling and URL encoding. Validate file size/type and access
requirements for the requested change. Keep service account JSON, bucket credentials,
password hashes and signed URLs out of client bundles and logs.

Use disposable fixtures or emulators for write verification when available. Do not
run destructive migrations or use production collections as test fixtures. Update
.env.example with names/placeholders only when changing configuration.

Deployment runs node server.js and needs long-lived Socket.IO connections. Verify
Docker standalone output, copied runtime files, port binding and credential setup
when changing deployment. render.yaml still lists legacy database/Redis variables;
derive required variables from current source. Prisma scripts and lib/redis.ts are
known leftovers, not instructions to install extra infrastructure automatically.

Run relevant type/build checks and verify error and unauthorized paths. Clearly
separate compile verification from integration checks requiring Firebase/R2 credentials.
