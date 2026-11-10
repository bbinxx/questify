const { createServer } = require('node:http')
const next = require('next')
const { loadEnvConfig } = require('@next/env')
const { createGameServer } = require('./server/game-server')
const { loadPublishedGame } = require('./lib/presentations')
const { getFirestore, persistSession } = require('./lib/firebase-admin')

process.env.NODE_ENV ||= 'development'
const dev = process.env.NODE_ENV !== 'production'
loadEnvConfig(process.cwd(), dev)
const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOSTNAME || '0.0.0.0'
const app = next({ dev, hostname, port, webpack: true })
let runtime
let httpServer

app.prepare().then(() => {
    httpServer = createServer(app.getRequestHandler())
    runtime = createGameServer(httpServer, {
        loadGame: id => loadPublishedGame(getFirestore(), id),
        saveSession: persistSession,
    })
    httpServer.on('error', error => { console.error('Server error:', error.message); process.exitCode = 1 })
    httpServer.listen(port, hostname, () => console.log(`Questify listening on port ${port}`))
}).catch(error => { console.error('Startup failed:', error.message); process.exitCode = 1 })

async function shutdown() {
    const deadline = setTimeout(() => process.exit(1), 10000)
    deadline.unref()
    if (runtime) await runtime.close()
    await app.close()
    clearTimeout(deadline)
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
