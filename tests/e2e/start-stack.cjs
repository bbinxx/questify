const { spawn } = require('node:child_process')
const net = require('node:net')
const { startStorage } = require('./storage.cjs')
const { emulatorPath } = require('./emulator.cjs')
const { environment, PROJECT_ID } = require('./environment.cjs')

const env = environment()
const children = new Set()
let storage, shuttingDown = false
function child(args, binary = global.process.execPath, service = false) {
    const process = spawn(binary, args, { env, stdio: 'inherit' })
    children.add(process)
    process.once('error', error => {
        children.delete(process)
        console.error(`Unable to start ${binary}: ${error.message}`)
        void stop(1)
    })
    process.once('exit', (code, signal) => {
        children.delete(process)
        if (!shuttingDown && (service || code !== 0 || signal)) void stop(1)
    })
    return process
}
function run(args) {
    return new Promise((resolve, reject) => child(args).once('exit', code => code === 0 ? resolve() : reject(new Error(`Command failed: ${args[0]}`))))
}
async function freePort(port) {
    const server = net.createServer()
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve) })
    await new Promise(resolve => server.close(resolve))
}
async function waitForEmulator() {
    for (let i = 0; i < 180; i++) {
        try { const response = await fetch(`http://127.0.0.1:8088/v1/projects/${PROJECT_ID}/databases/(default)/documents/users`, { headers: { Authorization: 'Bearer owner' } }); if (response.ok) return } catch {}
        await new Promise(resolve => setTimeout(resolve, 500))
    }
    throw new Error('Firestore emulator did not become ready')
}
async function stop(code = 0) {
    if (shuttingDown) return
    shuttingDown = true
    const deadline = setTimeout(() => process.exit(code || 1), 8000)
    for (const process of children) process.kill('SIGTERM')
    await Promise.all([...children].map(process => new Promise(resolve => process.once('exit', resolve))))
    if (storage) await storage.close()
    clearTimeout(deadline)
    process.exit(code)
}
async function main() {
    for (const port of [3210,8088,4569]) await freePort(port)
    storage = await startStorage()
    child(['-Duser.language=en', '-jar', await emulatorPath(), '--host', '127.0.0.1', '--port', '8088', '--project_id', PROJECT_ID, '--rules', 'tests/e2e/firestore.rules', '--single_project_mode', 'true'], 'java', true)
    await waitForEmulator()
    await run(['node_modules/next/dist/bin/next', 'build', '--webpack'])
    child(['server.js'], process.execPath, true)
}
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
main().catch(error => { console.error(error.message); void stop(1) })
