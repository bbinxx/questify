---
name: questify-backend
description: Develop or review Questify Firestore persistence, server-side authentication, quiz actions, R2 media handling and custom-server deployment.
---

# Questify backend and media

Follow callers through app/actions, app/api, lib/db.ts and lib/firebase.ts.
DatabaseService is the current persistence boundary. The /api/quiz handler delegates to authenticated quiz actions; preserve parity
with their validation and ownership checks. Preserve serialized question options and timestamp contracts when mapping.

Authentication uses bcrypt and signed, expiring questify_session cookies. Firebase Admin bypasses
client security rules; authorization must be checked in trusted application code.
Cookie presence alone does not prove identity or ownership. When changing auth or
protected writes, verify session integrity, game ownership and unauthorized behavior.
Do not represent current code as secure merely because this skill describes checks.

For media changes inspect app/actions/upload.ts, lib/r2.ts and
app/api/media/[...key]/route.ts together. Upload keys include nested media/user paths;
check dynamic route handling and URL encoding. Validate file size/type and access
requirements for the requested change. Keep service account JSON, bucket credentials,
password hashes and signed URLs out of client bundles and logs.

Use disposable fixtures or emulators for write verification when available. Do not
run destructive migrations or use production collections as test fixtures. Update
.env.example with names/placeholders only when changing configuration.

Deployment runs node server.js and needs long-lived Socket.IO connections. Verify
Docker standalone output, copied runtime files, port binding and credential setup
when changing deployment. Derive required variables from current source and .env.example.
Prisma and the unused Redis module were removed; do not reinstall them speculatively.

Run relevant type/build checks and verify error and unauthorized paths. Clearly
separate compile verification from integration checks requiring Firebase/R2 credentials.
