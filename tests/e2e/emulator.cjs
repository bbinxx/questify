const { createHash } = require('node:crypto')
const { readFile, mkdir, writeFile, rename } = require('node:fs/promises')
const { join } = require('node:path')
const { homedir } = require('node:os')
const VERSION = '1.22.0'
// Published SHA-256 from firebase-tools' downloadableEmulatorInfo.json.
const SHA256 = '9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c'
const filename = `cloud-firestore-emulator-v${VERSION}.jar`
const local = join(process.cwd(), '.cache', 'firebase', filename)
async function verified(path) {
    try { const bytes = await readFile(path); return createHash('sha256').update(bytes).digest('hex') === SHA256 } catch { return false }
}
async function emulatorPath(download = false) {
    for (const path of [local, join(homedir(), '.cache', 'firebase', 'emulators', filename)]) if (await verified(path)) return path
    if (!download) throw new Error('Firestore emulator missing. Run npm run test:e2e:install (requires Java 21+).')
    console.log(`Downloading official Firestore emulator ${VERSION}`)
    const response = await fetch(`https://storage.googleapis.com/firebase-preview-drop/emulator/${filename}`)
    if (!response.ok) throw new Error(`Emulator download failed: ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (createHash('sha256').update(bytes).digest('hex') !== SHA256) throw new Error('Firestore emulator checksum mismatch')
    await mkdir(join(process.cwd(), '.cache', 'firebase'), { recursive: true })
    await writeFile(`${local}.tmp`, bytes)
    await rename(`${local}.tmp`, local)
    return local
}
module.exports = { emulatorPath }
if (require.main === module) emulatorPath(true).catch(error => { console.error(error.message); process.exitCode = 1 })
