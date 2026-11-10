const { Server } = require('socket.io')
const { randomUUID } = require('node:crypto')
const { ACTIVITIES } = require('../lib/activities/registry')
const { publicAnswers } = require('../lib/validation')
const { userFromCookie } = require('../lib/session-token')

const DURATIONS = { INTRO: 5000, QUESTION_REVEAL: 4000, MEDIA_FOCUS: 3000, THINKING: 5000, LOCKED: 2000, RESULTS: 5000, LIVE_STATS: 4000, LEADERBOARD: 6000, TRANSITION: 4000 }
const COLORS = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500']
const ICONS = ['△', '◇', '○', '□']
const roomCodeValid = id => typeof id === 'string' && /^[A-Z0-9]{4,6}$/.test(id)
const docIdValid = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id)
const cleanPlayer = p => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color, score: p.score, lastPoints: p.lastPoints, connected: p.connected, size: p.size, x: p.x, y: p.y, vx: p.vx, vy: p.vy })
const leaderboard = room => [...room.players.values()].sort((a, b) => b.score - a.score).slice(0, 10).map((p, i) => ({ ...cleanPlayer(p), rank: i + 1 }))

function computeStats(room, index) {
    const responses = room.questionStats[index] || []
    const answerCounts = {}
    for (const r of responses) answerCounts[r.answerIndex] = (answerCounts[r.answerIndex] || 0) + 1
    return { answerCounts, totalAnswered: responses.length, correctCount: responses.filter(r => r.correct).length,
        avgResponseTime: responses.length ? Math.round(responses.reduce((n, r) => n + r.timeTaken, 0) / responses.length) : 0 }
}

function sessionStats(room) {
    const perQuestion = room.questions.flatMap((q, i) => {
        const activity = ACTIVITIES[q.type]
        if (!activity.hasResponse) return []
        const stats = computeStats(room, i)
        return [{ activityId: q.id, text: q.question, options: q.answers.map(answer => answer.text), kind: activity.kind, scored: activity.scored, ...stats,
            difficulty: activity.scored && stats.totalAnswered ? Math.round((1 - stats.correctCount / stats.totalAnswered) * 100) : null }]
    })
    const responses = room.questionStats.flatMap((responses, i) => ACTIVITIES[room.questions[i].type].scored ? responses : [])
    return { startedAt: room.startedAt, endedAt: new Date().toISOString(), totalPlayers: room.players.size,
        totalQuestions: room.questions.filter(q => ACTIVITIES[q.type].scored).length, totalActivities: room.questions.length, perQuestion,
        global: { correctCount: responses.filter(r => r.correct).length, totalAnswered: responses.length,
            avgResponseTime: responses.length ? Math.round(responses.reduce((n, r) => n + r.timeTaken, 0) / responses.length) : 0 },
        mvp: leaderboard(room)[0] || null }
}

function createGameServer(httpServer, { loadGame, saveSession, authenticate = socket => userFromCookie(socket.request.headers.cookie), durations = {} }) {
    const timing = { ...DURATIONS, ...durations }
    const rooms = new Map()
    const io = new Server(httpServer, {
        maxHttpBufferSize: 64 * 1024, pingTimeout: 60000, pingInterval: 25000,
        allowRequest: (req, callback) => {
            // Browsers must use the same origin; native clients may omit Origin.
            try { callback(null, !req.headers.origin || new URL(req.headers.origin).host === req.headers.host) }
            catch { callback(null, false) }
        },
    })

    function cancelRun(room) {
        room.runId++
        if (room.phase) { clearInterval(room.phase.timer); room.phase.resolve(false); room.phase = null }
        room.isPaused = false
    }
    function removeRoom(id) {
        const room = rooms.get(id)
        if (!room) return
        cancelRun(room)
        io.to(id).emit('room-error', { message: 'This room has closed' })
        io.in(id).socketsLeave(id)
        rooms.delete(id)
    }
    const cleanup = setInterval(() => {
        for (const [id, room] of rooms) {
            if (Date.now() - room.createdAt > 3_600_000 || (!room.host && [...room.players.values()].every(p => !p.connected) && Date.now() - room.lastActive > 300000)) removeRoom(id)
        }
    }, 60000)
    cleanup.unref()

    function snapshot(room, player) {
        const now = Date.now()
        const duration = room.gameState === 'CONTENT' ? 0 : room.phase ? Math.max(0, Math.ceil((room.phase.remaining - (room.isPaused ? 0 : now - room.phase.lastTick)) / 1000)) : 0
        return { ...room.snapshot, duration, paused: room.isPaused,
            ...(player ? { score: player.score, hasAnswered: player.hasAnswered, answeredIndex: player.answerIndex ?? -1,
                ...(['LOCKED', 'RESULTS', 'LIVE_STATS', 'LEADERBOARD', 'TRANSITION', 'FINAL_RESULTS'].includes(room.gameState) ? {
                    feedback: { correct: player.lastCorrect, points: player.lastPoints, score: player.score, streak: player.streak, hasAnswered: player.hasAnswered },
                } : {}),
            } : {}) }
    }
    function emitPhase(room, state, data = {}) {
        room.gameState = state
        room.snapshot = { ...room.snapshot, ...data, state }
        // Results-only fields cannot carry into the next question.
        if (state === 'QUESTION_REVEAL' || state === 'CONTENT') room.snapshot = { state, ...data }
        io.to(room.id).emit('game-state', { ...room.snapshot, paused: room.isPaused })
    }
    function phaseWait(room, ms, runId, allAnswered = false) {
        if (room.runId !== runId || !rooms.has(room.id)) return Promise.resolve(false)
        return new Promise(resolve => {
            const phase = { remaining: ms, lastTick: Date.now(), resolve, timer: null }
            const finish = result => {
                clearInterval(phase.timer)
                if (room.phase === phase) room.phase = null
                resolve(result)
            }
            if (!Number.isFinite(ms)) { room.phase = phase; return }
            phase.timer = setInterval(() => {
                const now = Date.now()
                if (room.runId !== runId) return finish(false)
                if (!room.isPaused) phase.remaining -= now - phase.lastTick
                phase.lastTick = now
                if (room.isPaused) return
                const players = [...room.players.values()].filter(p => p.connected)
                if (phase.remaining <= 0 || (allAnswered && players.length && players.every(p => p.hasAnswered))) finish(true)
            }, 10)
            room.phase = phase
        })
    }
    async function finishGame(room) {
        if (room.gameState === 'FINAL_RESULTS' || !room.startedAt) return
        cancelRun(room)
        const stats = sessionStats(room)
        const players = [...room.players.values()].sort((a, b) => b.score - a.score).map(cleanPlayer)
        emitPhase(room, 'FINAL_RESULTS', { leaderboard: leaderboard(room), sessionStats: stats })
        try {
            await saveSession({ id: room.sessionId, versionId: room.versionId, gameId: room.gameId, hostId: room.ownerId, roomCode: room.id,
                startedAt: stats.startedAt, endedAt: stats.endedAt, players, stats })
        } catch (error) {
            console.error('Session persistence failed:', error.message)
            if (room.host) io.to(room.host).emit('session-error', { message: 'The game finished, but analytics could not be saved.' })
        }
    }
    async function runGame(room, runId) {
        const phase = async (state, ms, data = {}, allAnswered = false) => {
            if (room.runId !== runId) return false
            emitPhase(room, state, { ...data, duration: Number.isFinite(ms) ? Math.ceil(ms / 1000) : 0 })
            return phaseWait(room, ms, runId, allAnswered)
        }
        if (!await phase('INTRO', timing.INTRO, { quizTitle: room.quizTitle, totalQ: room.questions.length })) return
        for (let i = 0; i < room.questions.length; i++) {
            if (room.runId !== runId) return
            room.currentQ = i
            const q = room.questions[i]
            for (const p of room.players.values()) { p.hasAnswered = false; p.lastCorrect = false; p.lastPoints = 0; p.answerIndex = -1 }
            const data = { activityId: q.id, questionText: q.question, questionType: q.type, mediaUrl: q.mediaUrl || '', qIndex: i + 1, totalQ: room.questions.length,
                kind: ACTIVITIES[q.type].kind, scored: ACTIVITIES[q.type].scored }
            if (q.type === 'TEXT_SLIDE') {
                if (!await phase('CONTENT', Infinity, { ...data, body: q.body, answers: [] })) return
                continue
            }
            if (!await phase('QUESTION_REVEAL', timing.QUESTION_REVEAL, data)) return
            if (q.mediaUrl && !await phase('MEDIA_FOCUS', timing.MEDIA_FOCUS, data)) return
            if (!await phase('THINKING', timing.THINKING, data)) return
            room.answerElapsed = 0
            room.qStartTime = Date.now()
            if (!await phase('ANSWERING', q.time * 1000, { ...data, answers: publicAnswers(q) }, true)) return
            for (const p of room.players.values()) if (p.connected && ACTIVITIES[q.type].scored) io.to(p.id).emit('round-feedback', {
                correct: p.lastCorrect, points: p.lastPoints, score: p.score, streak: p.streak, hasAnswered: p.hasAnswered,
            })
            if (!await phase('LOCKED', timing.LOCKED)) return
            const stats = computeStats(room, i)
            const correctResponses = (room.questionStats[i] || []).filter(r => r.correct).sort((a, b) => a.timeTaken - b.timeTaken)
            if (!await phase('RESULTS', timing.RESULTS, { ...data, answers: q.answers, correctIndex: ACTIVITIES[q.type].scored ? q.answers.findIndex(a => a.correct) : -1, stats, fastestCorrect: correctResponses[0]?.playerName || null })) return
            if (!ACTIVITIES[q.type].scored) continue
            if (!await phase('LIVE_STATS', timing.LIVE_STATS, { stats })) return
            if (!await phase('LEADERBOARD', timing.LEADERBOARD, { leaderboard: leaderboard(room) })) return
            if (i < room.questions.length - 1 && !await phase('TRANSITION', timing.TRANSITION, { nextQIndex: i + 2, funFact: 'Take a breath—the next question is coming!' })) return
        }
        if (room.runId === runId) await finishGame(room)
    }

    io.on('connection', socket => {
        const fail = message => socket.emit('room-error', { message })
        const guard = fn => async data => {
            try { await fn(data) } catch (error) { console.error('Room request failed:', error.message); fail('Unable to process this room request') }
        }
        const hostRoom = id => {
            const room = rooms.get(id)
            return room && room.host === socket.id && socket.data.role === 'host' ? room : null
        }
        const attach = async (room, role) => {
            if (socket.data.roomId && (socket.data.roomId !== room.id || socket.data.role !== role)) return false
            await socket.join(room.id)
            socket.data.roomId = room.id; socket.data.role = role
            room.lastActive = Date.now()
            return true
        }
        socket.on('host-room', guard(async data => {
            const userId = await authenticate(socket)
            if (!userId) return fail('Unauthorized: log in to host a game')
            if (!data || !roomCodeValid(data.roomCode) || !docIdValid(data.gameId)) return fail('Invalid room or quiz')
            const game = await loadGame(data.gameId)
            if (!game || game.hostId !== userId) return fail('Unauthorized to host this quiz')
            let room = rooms.get(data.roomCode)
            if (room && (room.ownerId !== userId || room.gameId !== data.gameId || (room.host && room.host !== socket.id && io.sockets.sockets.has(room.host)))) return fail('Room is already in use')
            if (!room) {
                if (rooms.size >= 1000) return fail('Server is full. Please try again later')
                const questions = (game.questions || []).map((q, index) => {
                    const options = JSON.parse(q.options)
                    return { id: q.id || String(index + 1), body: q.body || '', question: q.text, time: q.timeLimit, type: q.type || 'MULTIPLE_CHOICE', mediaUrl: q.mediaUrl || '', points: q.points || 'Standard',
                        answers: options.map((text, i) => ({ text, correct: q.type !== 'POLL' && i === q.correct, color: COLORS[i % 4], icon: ICONS[i % 4] })) }
                })
                if (!questions.length) return fail('This quiz has no questions')
                room = { id: data.roomCode, versionId: game.versionId || null, gameId: game.id, ownerId: userId, quizTitle: game.title, host: null, players: new Map(), questions,
                    gameState: 'WAITING', snapshot: { state: 'WAITING', quizTitle: game.title }, questionStats: [], currentQ: -1,
                    runId: 0, phase: null, isPaused: false, createdAt: Date.now(), lastActive: Date.now() }
                rooms.set(room.id, room)
            }
            room.host = socket.id
            if (!await attach(room, 'host')) { room.host = null; return fail('Leave your current room first') }
            socket.emit('host-ready', { roomCode: room.id })
            socket.emit('players-list', [...room.players.values()].filter(p => p.connected).map(cleanPlayer))
            socket.emit('game-state', snapshot(room))
        }))
        socket.on('display-join', guard(async id => {
            const room = roomCodeValid(id) && rooms.get(id)
            if (!room) return fail('Room not found')
            if (!await attach(room, 'display')) return fail('Leave your current room first')
            socket.emit('players-list', [...room.players.values()].filter(p => p.connected).map(cleanPlayer))
            socket.emit('game-state', snapshot(room))
        }))
        socket.on('join-room', guard(async data => {
            if (!data || !roomCodeValid(data.roomId) || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 20) return fail('Enter a valid room and name')
            const room = rooms.get(data.roomId)
            if (!room) return fail('Room not found')
            let player = room.players.get(socket.id) || (data.playerId && [...room.players.values()].find(p => p.playerId === data.playerId))
            if (!player && room.players.size >= 100) return fail('Room is full')
            if (room.gameState === 'FINAL_RESULTS' && !player) return fail('This game has ended')
            if (!await attach(room, 'player')) return fail('Leave your current room first')
            if (player) {
                const previous = player.id
                room.players.delete(previous)
                if (previous !== socket.id) { io.to(room.id).emit('player-left', previous); io.sockets.sockets.get(previous)?.disconnect(true) }
                player.id = socket.id; player.connected = true
            } else {
                player = { id: socket.id, playerId: randomUUID(), name: data.name.trim(), color: COLORS.includes(data.color) ? data.color : COLORS[0],
                    avatar: typeof data.avatar === 'string' && data.avatar.length <= 16 ? data.avatar : '🙂', score: 0, lastPoints: 0, streak: 0,
                    lastCorrect: false, totalCorrect: 0, hasAnswered: false, connected: true, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, size: 80, vx: 0.5, vy: 0.5 }
            }
            room.players.set(socket.id, player)
            socket.emit('room-joined', { playerCount: room.players.size, playerId: player.playerId })
            socket.emit('game-state', snapshot(room, player))
            socket.to(room.id).emit('player-joined', cleanPlayer(player))
            io.to(room.id).emit('player-count-update', [...room.players.values()].filter(p => p.connected).length)
        }))
        socket.on('start-game', guard(data => {
            const room = hostRoom(typeof data === 'object' ? data?.roomCode : data)
            if (!room) return
            cancelRun(room)
            room.startedAt = new Date().toISOString(); room.sessionId = randomUUID(); room.questionStats = []
            room.snapshot = {}; room.currentQ = -1
            for (const p of room.players.values()) { p.score = 0; p.lastPoints = 0; p.streak = 0; p.hasAnswered = false; p.lastCorrect = false; p.totalCorrect = 0 }
            void runGame(room, room.runId).catch(error => { console.error('Game failed:', error.message); cancelRun(room); fail('Game interrupted') })
        }))
        for (const event of ['host-advance', 'next-question']) socket.on(event, id => {
            const room = hostRoom(id)
            if (!room || room.isPaused || !room.phase) return
            const p = room.phase; clearInterval(p.timer); room.phase = null; p.resolve(true)
        })
        socket.on('end-game', guard(async id => { const room = hostRoom(id); if (room) await finishGame(room) }))
        socket.on('host-pause', id => {
            const room = hostRoom(id)
            if (!room || !room.phase || room.isPaused) return
            const now = Date.now()
            room.phase.remaining -= now - room.phase.lastTick
            if (room.gameState === 'ANSWERING') room.answerElapsed += now - room.qStartTime
            room.phase.lastTick = now; room.isPaused = true
            io.to(id).emit('game-paused', {})
        })
        socket.on('host-resume', id => {
            const room = hostRoom(id)
            if (!room || !room.phase || !room.isPaused) return
            room.phase.lastTick = Date.now(); room.qStartTime = Date.now(); room.isPaused = false
            io.to(id).emit('game-resumed', {})
        })
        socket.on('submit-answer', data => {
            if (!data || socket.data.role !== 'player' || socket.data.roomId !== data.roomId) return
            const room = rooms.get(data.roomId)
            if (!room || room.gameState !== 'ANSWERING' || room.isPaused) return
            const player = room.players.get(socket.id)
            if (!player || player.hasAnswered) return
            const q = room.questions[room.currentQ]
            const answer = data.answerIndex
            if (q.type === 'TYPE_ANSWER' ? typeof answer !== 'string' || !answer.trim() || answer.length > 500 : !Number.isInteger(answer) || answer < 0 || answer >= q.answers.length) return
            const timeTaken = room.answerElapsed + Date.now() - room.qStartTime
            if (timeTaken > q.time * 1000) return
            const correct = q.type !== 'POLL' && (q.type === 'TYPE_ANSWER' ? answer.trim().toLowerCase() === q.answers[0].text.trim().toLowerCase() : q.answers[answer].correct)
            player.hasAnswered = true; player.answerIndex = answer; player.lastCorrect = correct
            const multiplier = q.type === 'POLL' || q.points === 'No points' ? 0 : q.points === 'Double points' ? 2 : 1
            if (q.type !== 'POLL') { if (correct) { player.streak++; player.totalCorrect++ } else player.streak = 0 }
            const points = correct && multiplier ? (Math.round(500 + 500 * Math.max(0, 1 - timeTaken / (q.time * 1000))) + Math.min(player.streak * 100, 500)) * multiplier : 0
            player.score += points; player.lastPoints = points
            if (!room.questionStats[room.currentQ]) room.questionStats[room.currentQ] = []
            room.questionStats[room.currentQ].push({ playerName: player.name, answerIndex: q.type === 'TYPE_ANSWER' ? (correct ? 0 : 1) : answer, correct, timeTaken, points })
            // The acknowledgment confirms receipt without revealing correctness early.
            socket.emit('answer-received', { accepted: true })
            io.to(room.host).emit('response-count', { answered: [...room.players.values()].filter(p => p.connected && p.hasAnswered).length, total: [...room.players.values()].filter(p => p.connected).length })
        })
        socket.on('player-reaction', data => {
            const room = data && rooms.get(data.roomId)
            const player = room?.players.get(socket.id)
            if (!player || typeof data.emoji !== 'string' || data.emoji.length > 16 || Date.now() - (player.lastReaction || 0) < 1000) return
            player.lastReaction = Date.now()
            io.to(room.id).emit('player-reaction', { name: player.name, emoji: data.emoji, avatar: player.avatar })
        })
        socket.on('disconnect', () => {
            const room = rooms.get(socket.data.roomId)
            if (!room) return
            room.lastActive = Date.now()
            const player = room.players.get(socket.id)
            if (player) { player.connected = false; io.to(room.id).emit('player-left', socket.id); io.to(room.id).emit('player-count-update', [...room.players.values()].filter(p => p.connected).length) }
            if (room.host === socket.id) { room.host = null; io.to(room.id).emit('host-disconnected') }
        })
    })
    return { io, rooms, removeRoom, close: async () => {
        clearInterval(cleanup)
        for (const room of rooms.values()) cancelRun(room)
        await new Promise(resolve => io.close(resolve))
    } }
}
module.exports = { createGameServer }
