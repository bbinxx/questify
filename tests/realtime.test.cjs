const test = require('node:test')
const assert = require('node:assert/strict')
const { createServer } = require('node:http')
const { io: connect } = require('socket.io-client')
const { createGameServer } = require('../server/game-server.js')

function event(socket, name, predicate = () => true) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { socket.off(name, listener); reject(new Error(`Timed out: ${name}`)) }, 3000)
        function listener(data) { if (predicate(data)) { clearTimeout(timer); socket.off(name, listener); resolve(data) } }
        socket.on(name, listener)
    })
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function fixture(t, overrides = {}) {
    const http = createServer()
    const sessions = []
    const quiz = { id: 'quiz', hostId: 'host', title: 'Test quiz', questions: [{ text: 'Question', options: '["Yes","No"]', correct: 0, timeLimit: 0.15, type: 'MULTIPLE_CHOICE' }] }
    const runtime = createGameServer(http, {
        authenticate: socket => socket.handshake.auth.host ? 'host' : null,
        loadGame: async () => quiz,
        saveSession: async session => sessions.push(session),
        durations: { INTRO: 30, QUESTION_REVEAL: 30, MEDIA_FOCUS: 30, THINKING: 30, LOCKED: 30, RESULTS: 30, LIVE_STATS: 30, LEADERBOARD: 30, TRANSITION: 30 },
        ...overrides,
    })
    await new Promise(resolve => http.listen(0, '127.0.0.1', resolve))
    const clients = []
    t.after(async () => { clients.forEach(s => s.disconnect()); await runtime.close() })
    async function client(host = false) {
        const s = connect(`http://127.0.0.1:${http.address().port}`, { autoConnect: false, transports: ['websocket'], auth: { host }, reconnection: false })
        clients.push(s)
        const ready = event(s, 'connect'); s.connect(); await ready
        return s
    }
    const host = await client(true)
    const ready = event(host, 'host-ready')
    host.emit('host-room', { roomCode: 'ABC123', gameId: 'quiz' }); await ready
    async function player(name = 'Player', playerId) {
        const s = await client()
        const ready = event(s, 'room-joined')
        const state = event(s, 'game-state')
        s.emit('join-room', { roomId: 'ABC123', name, playerId })
        return { socket: s, identity: (await ready).playerId, state: await state }
    }
    return { ...runtime, host, client, player, sessions, quiz }
}

test('rooms require authenticated hosts, reject invalid joins and emit one attendance event', async t => {
    const f = await fixture(t)
    const stranger = await f.client()
    const denied = event(stranger, 'room-error')
    stranger.emit('host-room', { roomCode: 'ABC123', gameId: 'quiz' })
    assert.match((await denied).message, /Unauthorized/)
    const missing = event(stranger, 'room-error')
    stranger.emit('join-room', { roomId: 'NOPE12', name: 'Player' })
    await missing
    assert.equal(f.rooms.size, 1)
    let joins = 0
    f.host.on('player-joined', () => joins++)
    await f.player()
    await sleep(30)
    assert.equal(joins, 1)
    const malformed = event(stranger, 'room-error')
    stranger.emit('join-room', null)
    await malformed
})

test('answer phase conceals correctness, rejects duplicate answers and restores reconnect state', async t => {
    const f = await fixture(t)
    const p = await f.player()
    const p2 = await f.player('Second')
    const answering = event(p.socket, 'game-state', d => d.state === 'ANSWERING')
    f.host.emit('start-game', 'ABC123')
    const snapshot = await answering
    assert.equal(snapshot.answers[0].correct, undefined)
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: -1 })
    const accepted = event(p.socket, 'answer-received')
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 0 })
    await accepted
    const score = f.rooms.get('ABC123').players.get(p.socket.id).score
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 0 })
    p.socket.disconnect()
    const reconnect = await f.player('Player', p.identity)
    assert.equal(f.rooms.get('ABC123').players.get(reconnect.socket.id).score, score)
    assert.equal(f.rooms.get('ABC123').players.size, 2)
    assert.ok(p2)
})

test('ending a game cancels the run and saves exactly one authoritative session', async t => {
    const f = await fixture(t)
    await f.player()
    const intro = event(f.host, 'game-state', d => d.state === 'INTRO')
    f.host.emit('start-game', 'ABC123'); await intro
    const final = event(f.host, 'game-state', d => d.state === 'FINAL_RESULTS')
    f.host.emit('end-game', 'ABC123'); await final
    f.host.emit('end-game', 'ABC123')
    await sleep(250)
    assert.equal(f.rooms.get('ABC123').gameState, 'FINAL_RESULTS')
    assert.equal(f.sessions.length, 1)
})

test('pause stops phase deadline and submissions until resumed', async t => {
    const f = await fixture(t)
    const p = await f.player()
    const answering = event(p.socket, 'game-state', d => d.state === 'ANSWERING')
    f.host.emit('start-game', 'ABC123'); await answering
    const paused = event(p.socket, 'game-paused')
    f.host.emit('host-pause', 'ABC123'); await paused
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 0 })
    await sleep(200)
    assert.equal(f.rooms.get('ABC123').gameState, 'ANSWERING')
    assert.equal(f.rooms.get('ABC123').players.get(p.socket.id).hasAnswered, false)
    const locked = event(p.socket, 'game-state', d => d.state === 'LOCKED')
    f.host.emit('host-resume', 'ABC123'); await locked
})

test('reconnecting during results restores personal feedback without exposing bearer identity', async t => {
    const f = await fixture(t, { durations: { INTRO: 20, QUESTION_REVEAL: 20, THINKING: 20, LOCKED: 20, RESULTS: 300 } })
    const p = await f.player()
    const answering = event(p.socket, 'game-state', d => d.state === 'ANSWERING')
    f.host.emit('start-game', 'ABC123'); await answering
    const results = event(p.socket, 'game-state', d => d.state === 'RESULTS')
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 0 }); await results
    p.socket.disconnect()
    const restored = await f.player('Player', p.identity)
    assert.equal(restored.state.feedback.correct, true)
    assert.ok(restored.state.score > 0)
    assert.equal(restored.state.leaderboard?.[0]?.playerId, undefined)
})

test('repeated join on the same socket cannot reset an answered question', async t => {
    const f = await fixture(t, { durations: { INTRO: 20, QUESTION_REVEAL: 20, THINKING: 20 } })
    const p = await f.player()
    await f.player('Second')
    const answering = event(p.socket, 'game-state', d => d.state === 'ANSWERING')
    f.host.emit('start-game', 'ABC123'); await answering
    const accepted = event(p.socket, 'answer-received')
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 1 }); await accepted
    const rejoined = event(p.socket, 'room-joined')
    p.socket.emit('join-room', { roomId: 'ABC123', name: 'New identity' }); await rejoined
    assert.equal(f.rooms.get('ABC123').players.get(p.socket.id).hasAnswered, true)
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 0 })
    await sleep(20)
    assert.equal(f.rooms.get('ABC123').questionStats[0].length, 1)
})

test('mixed presentation holds a content slide until the host advances, with reconnect and frozen content', async t => {
    const source = { id: 'quiz', hostId: 'host', versionId: 'v1', title: 'Mixed deck', questions: [
        { id: 'slide', text: 'Welcome', body: 'Read this\nThen continue', type: 'TEXT_SLIDE', options: '[]', correct: -1, timeLimit: 0 },
        { id: 'poll', text: 'Your choice', options: '["A","B"]', correct: 0, timeLimit: 0.1, type: 'POLL' },
    ] }
    const f = await fixture(t, { loadGame: async () => source })
    const p = await f.player()
    await f.player('Second')
    const display = await f.client()
    const displayReady = event(display, 'game-state')
    display.emit('display-join', 'ABC123'); await displayReady
    const content = event(p.socket, 'game-state', d => d.state === 'CONTENT')
    const displayContent = event(display, 'game-state', d => d.state === 'CONTENT')
    f.host.emit('start-game', 'ABC123')
    assert.equal((await content).body, 'Read this\nThen continue')
    assert.equal((await displayContent).questionText, 'Welcome')
    p.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 0 })
    p.socket.emit('host-advance', 'ABC123')
    await sleep(60)
    assert.equal(f.rooms.get('ABC123').gameState, 'CONTENT')
    assert.equal(f.rooms.get('ABC123').players.get(p.socket.id).score, 0)
    source.questions[0].body = 'Edited live source'
    p.socket.disconnect()
    const restored = await f.player('Player', p.identity)
    assert.equal(restored.state.body, 'Read this\nThen continue')
    const answering = event(restored.socket, 'game-state', d => d.state === 'ANSWERING')
    f.host.emit('host-advance', 'ABC123'); await answering
    const results = event(restored.socket, 'game-state', d => d.state === 'RESULTS')
    restored.socket.emit('submit-answer', { roomId: 'ABC123', answerIndex: 1 })
    const result = await results
    assert.equal(result.scored, false)
    assert.equal(result.correctIndex, -1)
    assert.equal(result.stats.correctCount, 0)
    assert.equal(f.rooms.get('ABC123').players.get(restored.socket.id).score, 0)
    const final = event(f.host, 'game-state', d => d.state === 'FINAL_RESULTS')
    f.host.emit('end-game', 'ABC123')
    const stats = (await final).sessionStats
    assert.equal(stats.totalQuestions, 0)
    assert.equal(stats.global.totalAnswered, 0)
    assert.equal(stats.perQuestion.length, 1)
    assert.equal(stats.perQuestion[0].kind, 'poll')
    assert.equal(f.sessions[0].versionId, 'v1')
})
