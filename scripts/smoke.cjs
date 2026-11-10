const assert = require('node:assert/strict')
const { io } = require('socket.io-client')
const base = process.env.QUESTIFY_SMOKE_URL || 'http://127.0.0.1:3000'
async function main() {
    const assets = new Set()
    for (const [path, expected] of [['/',200],['/join',200],['/login',200],['/signup',200],['/create',307],['/dashboard',307],['/edit/test',307],['/api/quiz',401],['/api/media/invalid',400]]) {
        const response = await fetch(base + path, { redirect: 'manual' })
        const html = await response.text()
        if (expected === 307) {
            assert.ok(response.status === 307 || (response.status === 200 && /http-equiv="refresh"[^>]+url=\/login/.test(html)), `${path}: expected HTTP or streamed login redirect`)
            if (response.status === 307) assert.equal(response.headers.get('location'), '/login')
        } else assert.equal(response.status, expected, path)
        for (const match of html.matchAll(/(?:src|href)="([^\"]+)"/g)) if (match[1].startsWith('/_next/')) assets.add(match[1].replaceAll('&amp;', '&'))
        console.log(`${path}: ${response.status}`)
    }
    for (const asset of assets) assert.equal((await fetch(base + asset)).status, 200, asset)
    console.log(`Verified ${assets.size} CSS/JavaScript assets without 404s`)
    await new Promise((resolve, reject) => {
        const socket = io(base, { transports: ['websocket'], reconnection: false })
        const timer = setTimeout(() => { socket.disconnect(); reject(new Error('Socket timeout')) }, 3000)
        socket.on('connect', () => socket.emit('host-room', { roomCode: 'TEST12', gameId: 'test' }))
        socket.on('room-error', data => { try { assert.match(data.message, /Unauthorized/); clearTimeout(timer); socket.disconnect(); resolve() } catch (error) { reject(error) } })
    })
    console.log('Production Socket.IO rejects anonymous host claims')
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
