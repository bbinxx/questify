const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

// ─────────────────────────────────────────────
// GAME STATES (13-state cinematic engine)
// ─────────────────────────────────────────────
const STATE = {
    WAITING:          'WAITING',
    INTRO:            'INTRO',
    QUESTION_REVEAL:  'QUESTION_REVEAL',
    MEDIA_FOCUS:      'MEDIA_FOCUS',
    THINKING:         'THINKING',
    ANSWERING:        'ANSWERING',
    LOCKED:           'LOCKED',
    RESULTS:          'RESULTS',
    LIVE_STATS:       'LIVE_STATS',
    LEADERBOARD:      'LEADERBOARD',
    TRANSITION:       'TRANSITION',
    FINAL_RESULTS:    'FINAL_RESULTS',
    END:              'END',
}

// Durations (ms) — tuned for cinematic rhythm
const DURATION = {
    INTRO:           5000,
    QUESTION_REVEAL: 4000,
    MEDIA_FOCUS:     3000,
    THINKING:        5000,  // overridden per-question if thinkTime set
    LOCKED:          2000,
    RESULTS:         5000,
    LIVE_STATS:      4000,
    LEADERBOARD:     6000,
    TRANSITION:      4000,
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Promise-based sleep, cancellable via AbortSignal */
function wait(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(new Error('ABORTED'))
        const tid = setTimeout(resolve, ms)
        signal?.addEventListener('abort', () => { clearTimeout(tid); reject(new Error('ABORTED')) })
    })
}

/** Compute answer distribution stats for a question */
function computeStats(room, questionIndex) {
    const stats = { answerCounts: [], totalAnswered: 0, correctCount: 0, avgResponseTime: 0 }
    const responses = room.questionStats[questionIndex] || []

    const countMap = {}
    let totalTime = 0

    for (const r of responses) {
        countMap[r.answerIndex] = (countMap[r.answerIndex] || 0) + 1
        if (r.correct) stats.correctCount++
        totalTime += r.timeTaken
    }

    stats.totalAnswered = responses.length
    stats.avgResponseTime = responses.length ? Math.round(totalTime / responses.length) : 0
    stats.answerCounts = countMap

    return stats
}

/** Sort players by score, return top 10 */
function getLeaderboard(room) {
    return Array.from(room.players.values())
        .filter(p => p.connected)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((p, i) => ({ ...p, rank: i + 1 }))
}

/** Find who answered fastest correctly */
function getFastestCorrect(room, questionIndex) {
    const responses = room.questionStats[questionIndex] || []
    const correct = responses.filter(r => r.correct).sort((a, b) => a.timeTaken - b.timeTaken)
    return correct[0]?.playerName || null
}

// ─────────────────────────────────────────────
// ROOM MANAGER
// ─────────────────────────────────────────────
class RoomManager {
    constructor() { this.rooms = new Map() }

    createRoom(id, hostId, questions) {
        this.rooms.set(id, {
            host: hostId,
            players: new Map(),
            gameState: STATE.WAITING,
            currentQ: -1,
            qStartTime: 0,
            questions: questions || [],
            questionStats: [],   // array of response arrays per question
            sessionStats: null,  // filled at END
            abortController: null,
            isPaused: false,
            createdAt: Date.now(),
        })
        return this.rooms.get(id)
    }

    getRoom(id) { return this.rooms.get(id) }

    removeRoom(id) {
        const room = this.rooms.get(id)
        if (room) {
            room.abortController?.abort()
            this.rooms.delete(id)
            console.log(`🗑️  Room ${id} removed`)
        }
    }

    cleanup() {
        const now = Date.now()
        for (const [id, room] of this.rooms.entries()) {
            const allGone = Array.from(room.players.values()).every(p => !p.connected)
            const isOld = (now - room.createdAt) > 3_600_000 // 1h
            if ((allGone && !room.host) || isOld) this.removeRoom(id)
        }
    }
}

const roomManager = new RoomManager()
setInterval(() => roomManager.cleanup(), 600_000)

// ─────────────────────────────────────────────
// MAIN SERVER
// ─────────────────────────────────────────────
const app = next({ dev, hostname: 'localhost', port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
    const httpServer = createServer(handler)
    const io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
        pingTimeout: 60000,
        pingInterval: 25000,
    })

    io.on('connection', (socket) => {
        console.log('👤 Client connected:', socket.id)

        // ───────── HOST EVENTS ─────────

        socket.on('host-room', (data) => {
            const roomId   = typeof data === 'object' ? data.roomCode  : data
            const questions = typeof data === 'object' ? data.questions : []

            console.log('🎯 Host joining room:', roomId)
            socket.join(roomId)
            socket.data = { role: 'host', roomId }

            let room = roomManager.getRoom(roomId)
            if (!room) {
                room = roomManager.createRoom(roomId, socket.id, questions)
                console.log('📦 New room created:', roomId)
            } else {
                room.host = socket.id
                if (questions?.length) room.questions = questions
            }

            socket.emit('players-list', Array.from(room.players.values()).filter(p => p.connected))
        })

        socket.on('start-game', (data) => {
            const roomId = typeof data === 'object' ? data.roomCode : data
            const room = roomManager.getRoom(roomId)
            if (!room || room.host !== socket.id) return

            // Reset all player stats
            room.players.forEach(p => {
                p.score = 0; p.lastPoints = 0; p.streak = 0
                p.hasAnswered = false; p.lastCorrect = false
                p.totalCorrect = 0; p.fastestTime = Infinity
            })
            room.currentQ = -1
            room.questionStats = []
            room.abortController?.abort()
            room.startedAt = new Date().toISOString()

            console.log('🎮 Starting game in room:', roomId)
            runGameLoop(roomId, io)
        })

        socket.on('host-advance', (roomId) => {
            // Host manually skips to next phase
            const room = roomManager.getRoom(roomId)
            if (!room || room.host !== socket.id) return
            console.log('⏭️  Host advancing room:', roomId)
            room.abortController?.abort()
        })

        socket.on('host-pause', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (!room || room.host !== socket.id) return
            room.isPaused = true
            io.to(roomId).emit('game-paused', {})
            console.log('⏸️  Game paused:', roomId)
        })

        socket.on('host-resume', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (!room || room.host !== socket.id) return
            room.isPaused = false
            io.to(roomId).emit('game-resumed', {})
            console.log('▶️  Game resumed:', roomId)
        })

        socket.on('end-game', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (!room || room.host !== socket.id) return
            room.abortController?.abort()
            room.gameState = STATE.FINAL_RESULTS
            io.to(roomId).emit('game-state', {
                state: STATE.FINAL_RESULTS,
                leaderboard: getLeaderboard(room),
                sessionStats: buildSessionStats(room),
            })
            console.log('🏁 Game ended in room:', roomId)
        })

        // Legacy compat
        socket.on('next-question', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (!room || room.host !== socket.id) return
            room.abortController?.abort()
        })

        socket.on('show-leaderboard', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (!room || room.host !== socket.id) return
            room.gameState = STATE.LEADERBOARD
            io.to(roomId).emit('game-state', {
                state: STATE.LEADERBOARD,
                leaderboard: getLeaderboard(room),
            })
        })

        // ───────── DISPLAY EVENTS ─────────
        socket.on('display-join', (roomId) => {
            console.log('📺 Display screen joined room:', roomId)
            socket.join(roomId)
            socket.data = { role: 'display', roomId }
            const room = roomManager.getRoom(roomId)
            if (room) {
                socket.emit('game-state', { state: room.gameState })
                socket.emit('players-list', Array.from(room.players.values()).filter(p => p.connected))
            }
        })

        // ───────── PLAYER EVENTS ─────────

        socket.on('join-room', ({ roomId, name, color, avatar, playerId }) => {
            console.log('🎮 Player joining:', { roomId, name })
            let room = roomManager.getRoom(roomId)
            if (!room) room = roomManager.createRoom(roomId, null, [])

            const size  = Math.floor(Math.random() * 70 + 80)
            const angle = Math.random() * Math.PI * 2
            const speed = Math.random() * 1.2 + 0.3

            // Rejoin check
            let existing = null, oldSid = null
            for (const [sid, p] of room.players.entries()) {
                if (p.playerId === playerId) { existing = p; oldSid = sid; break }
            }

            socket.join(roomId)
            socket.data = { role: 'player', roomId }

            if (existing) {
                room.players.delete(oldSid)
                existing.id = socket.id
                existing.connected = true
                room.players.set(socket.id, existing)
                console.log('🔄 Rejoining player:', name)
                socket.emit('game-state', { state: room.gameState, score: existing.score })
            } else {
                const newPlayer = {
                    id: socket.id, playerId: playerId || socket.id,
                    name, color, avatar: avatar || '🙂',
                    score: 0, lastPoints: 0, streak: 0,
                    hasAnswered: false, lastCorrect: false,
                    totalCorrect: 0, fastestTime: Infinity,
                    connected: true,
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 80 + 10,
                    size, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                }
                room.players.set(socket.id, newPlayer)
                socket.to(roomId).emit('player-joined', newPlayer)
                io.to(room.host).emit('player-joined', newPlayer)
                if (room.gameState !== STATE.WAITING) {
                    socket.emit('game-state', { state: room.gameState, score: 0 })
                }
            }

            socket.emit('room-joined', { playerCount: room.players.size, playerId: playerId || socket.id })
            io.to(roomId).emit('player-count-update',
                Array.from(room.players.values()).filter(p => p.connected).length
            )
            console.log('✅ Join complete. Players:', room.players.size)
        })

        socket.on('submit-answer', ({ roomId, answerIndex }) => {
            const room = roomManager.getRoom(roomId)
            if (!room || room.gameState !== STATE.ANSWERING) return

            const player = room.players.get(socket.id)
            if (!player || player.hasAnswered) return

            const question = room.questions[room.currentQ]
            let isCorrect = false
            let pointsMultiplier = 1

            if (question.type === 'POLL') {
                isCorrect = true
                pointsMultiplier = 0 // No points for polls
            } else if (question.type === 'TYPE_ANSWER') {
                // For TYPE_ANSWER, answerIndex is the string the user typed
                const correctAnswer = question.answers[0]?.text || ''
                isCorrect = (typeof answerIndex === 'string' && answerIndex.toLowerCase().trim() === correctAnswer.toLowerCase().trim())
            } else {
                isCorrect = question.answers[answerIndex]?.correct === true
            }
            const timeTaken = Date.now() - room.qStartTime

            player.hasAnswered = true
            player.lastCorrect = isCorrect

            let points = 0
            if (isCorrect && pointsMultiplier > 0) {
                const timeRatio = Math.max(0, 1 - timeTaken / ((question.time || 20) * 1000))
                points = Math.round((500 + 500 * timeRatio) * pointsMultiplier)
                player.streak++
                points += Math.min(player.streak * 100, 500)
                player.totalCorrect++
                if (timeTaken < player.fastestTime) player.fastestTime = timeTaken
            } else {
                player.streak = 0
            }

            player.score += points
            player.lastPoints = points

            // Track per-question stats
            if (!room.questionStats[room.currentQ]) room.questionStats[room.currentQ] = []
            room.questionStats[room.currentQ].push({
                playerId: player.playerId,
                playerName: player.name,
                answerIndex,
                correct: isCorrect,
                timeTaken,
                points,
            })

            // Acknowledge
            socket.emit('answer-received', { correct: isCorrect, points })

            // Live response count to presenter
            const answered = Array.from(room.players.values()).filter(p => p.hasAnswered).length
            const total    = Array.from(room.players.values()).filter(p => p.connected).length
            io.to(room.host).emit('response-count', { answered, total })

            console.log(`📝 ${player.name}: ${isCorrect ? '✅' : '❌'} +${points} pts (${answered}/${total})`)
        })

        socket.on('player-reaction', ({ roomId, emoji }) => {
            const room = roomManager.getRoom(roomId)
            if (!room) return
            const player = room.players.get(socket.id)
            if (!player) return
            // Broadcast reaction to presenter and TV screens
            io.to(roomId).emit('player-reaction', { name: player.name, emoji, avatar: player.avatar })
        })

        socket.on('disconnect', () => {
            console.log('👋 Client disconnected:', socket.id)
            const { roomId, role } = socket.data || {}
            if (!roomId) return

            const room = roomManager.getRoom(roomId)
            if (!room) return

            if (role === 'player') {
                const p = room.players.get(socket.id)
                if (p) {
                    p.connected = false
                    socket.to(roomId).emit('player-left', socket.id)
                    io.to(roomId).emit('player-count-update',
                        Array.from(room.players.values()).filter(pl => pl.connected).length
                    )
                    console.log('📴 Player disconnected:', p.name)
                }
            } else if (role === 'host') {
                console.log('📴 Host disconnected from room:', roomId)
                io.to(roomId).emit('host-disconnected')
            }
        })
    })

    // ─────────────────────────────────────────────
    // CINEMATIC GAME LOOP — 13-state engine
    // ─────────────────────────────────────────────
    async function runGameLoop(roomId, io) {
        const room = roomManager.getRoom(roomId)
        if (!room) return

        const questions = room.questions
        if (!questions?.length) {
            console.log('❌ No questions in room:', roomId)
            return
        }

        // ── INTRO ──
        room.abortController = new AbortController()
        const { signal } = room.abortController
        room.gameState = STATE.INTRO

        io.to(roomId).emit('game-state', {
            state: STATE.INTRO,
            quizTitle: room.quizTitle || 'Questify',
            totalQ: questions.length,
        })
        console.log('🎬 INTRO')

        try { await wait(DURATION.INTRO, signal) } catch { /* host skipped */ }

        // ── QUESTION LOOP ──
        for (let qi = 0; qi < questions.length; qi++) {
            room.abortController = new AbortController()
            const sig = room.abortController.signal

            room.currentQ = qi
            const question = questions[qi]
            const hasMedia = !!(question.mediaUrl || question.media)
            const answerDuration = (question.time || 20) * 1000
            const thinkDuration  = (question.thinkTime || 5) * 1000

            // Reset per-question state
            room.players.forEach(p => {
                p.hasAnswered = false
                p.lastCorrect = false
                p.lastPoints = 0
            })

            // ── QUESTION_REVEAL ──
            room.gameState = STATE.QUESTION_REVEAL
            io.to(roomId).emit('game-state', {
                state: STATE.QUESTION_REVEAL,
                questionText: question.question,
                mediaUrl: question.mediaUrl || '',
                questionType: question.type || 'MULTIPLE_CHOICE',
                qIndex: qi + 1,
                totalQ: questions.length,
                hasMedia,
            })
            console.log(`📖 QUESTION_REVEAL [${qi + 1}/${questions.length}]`)
            try { await wait(DURATION.QUESTION_REVEAL, sig) } catch { /* skip */ }

            // ── MEDIA_FOCUS (only if question has media) ──
            if (hasMedia && !sig.aborted) {
                room.gameState = STATE.MEDIA_FOCUS
                io.to(roomId).emit('game-state', {
                    state: STATE.MEDIA_FOCUS,
                    mediaUrl: question.mediaUrl || '',
                    questionText: question.question,
                })
                console.log('🖼️  MEDIA_FOCUS')
                try { await wait(DURATION.MEDIA_FOCUS, sig) } catch { /* skip */ }
            }

            // ── THINKING ──
            if (!sig.aborted) {
                room.gameState = STATE.THINKING
                io.to(roomId).emit('game-state', {
                    state: STATE.THINKING,
                    questionText: question.question,
                    mediaUrl: question.mediaUrl || '',
                    duration: Math.round(thinkDuration / 1000),
                })
                console.log('🤔 THINKING')
                try { await wait(thinkDuration, sig) } catch { /* skip */ }
            }

            // ── ANSWERING ──
            room.gameState = STATE.ANSWERING
            room.qStartTime = Date.now()
            io.to(roomId).emit('game-state', {
                state: STATE.ANSWERING,
                questionText: question.question,
                answers: question.answers,
                mediaUrl: question.mediaUrl || '',
                duration: Math.round(answerDuration / 1000),
                questionType: question.type || 'MULTIPLE_CHOICE',
            })
            console.log('⏱️  ANSWERING', Math.round(answerDuration / 1000), 'sec')

            // Wait for timer OR all answered
            const abortAns = new AbortController()
            room.abortController = abortAns
            try {
                await Promise.race([
                    wait(answerDuration, abortAns.signal),
                    waitAllAnswered(room, abortAns.signal),
                ])
            } catch { /* skip */ }

            // ── LOCKED ──
            room.gameState = STATE.LOCKED
            io.to(roomId).emit('game-state', { state: STATE.LOCKED })
            console.log('🔒 LOCKED')

            // Send individual round feedback
            room.players.forEach(p => {
                if (p.connected) {
                    io.to(p.id).emit('round-feedback', {
                        correct: p.lastCorrect,
                        points: p.lastPoints,
                        score: p.score,
                        streak: p.streak,
                        hasAnswered: p.hasAnswered,
                    })
                }
            })

            const lockAbort = new AbortController()
            room.abortController = lockAbort
            try { await wait(DURATION.LOCKED, lockAbort.signal) } catch { /* skip */ }

            // ── RESULTS ──
            const stats = computeStats(room, qi)
            room.gameState = STATE.RESULTS
            io.to(roomId).emit('game-state', {
                state: STATE.RESULTS,
                correctIndex: question.answers.findIndex(a => a.correct),
                questionText: question.question,
                answers: question.answers,
                mediaUrl: question.mediaUrl || '',
                stats,
                fastestCorrect: getFastestCorrect(room, qi),
            })
            console.log('📊 RESULTS')
            const resAbort = new AbortController()
            room.abortController = resAbort
            try { await wait(DURATION.RESULTS, resAbort.signal) } catch { /* skip */ }

            // ── LIVE_STATS ──
            room.gameState = STATE.LIVE_STATS
            io.to(roomId).emit('game-state', {
                state: STATE.LIVE_STATS,
                stats,
                questionText: question.question,
                answers: question.answers,
            })
            console.log('📈 LIVE_STATS')
            const statAbort = new AbortController()
            room.abortController = statAbort
            try { await wait(DURATION.LIVE_STATS, statAbort.signal) } catch { /* skip */ }

            // ── LEADERBOARD ──
            room.gameState = STATE.LEADERBOARD
            io.to(roomId).emit('game-state', {
                state: STATE.LEADERBOARD,
                leaderboard: getLeaderboard(room),
                qIndex: qi + 1,
                totalQ: questions.length,
            })
            console.log('🏆 LEADERBOARD')
            const lbAbort = new AbortController()
            room.abortController = lbAbort
            try { await wait(DURATION.LEADERBOARD, lbAbort.signal) } catch { /* skip */ }

            // ── TRANSITION (between questions only) ──
            if (qi < questions.length - 1) {
                room.gameState = STATE.TRANSITION
                io.to(roomId).emit('game-state', {
                    state: STATE.TRANSITION,
                    nextQIndex: qi + 2,
                    totalQ: questions.length,
                    funFact: getRandomFact(),
                })
                console.log('⏭️  TRANSITION')
                const trAbort = new AbortController()
                room.abortController = trAbort
                try { await wait(DURATION.TRANSITION, trAbort.signal) } catch { /* skip */ }
            }
        }

        // ── FINAL_RESULTS ──
        room.gameState = STATE.FINAL_RESULTS
        const sessionStats = buildSessionStats(room)
        io.to(roomId).emit('game-state', {
            state: STATE.FINAL_RESULTS,
            leaderboard: getLeaderboard(room),
            sessionStats,
        })
        console.log('🎉 FINAL_RESULTS')
    }

    /** Resolves when all connected players have answered */
    function waitAllAnswered(room, signal) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(new Error('ABORTED'))
            const check = () => {
                if (signal?.aborted) return reject(new Error('ABORTED'))
                const connected = Array.from(room.players.values()).filter(p => p.connected)
                if (connected.length > 0 && connected.every(p => p.hasAnswered)) resolve()
                else setTimeout(check, 300)
            }
            check()
            signal?.addEventListener('abort', () => reject(new Error('ABORTED')))
        })
    }

    /** Build full session analytics summary */
    function buildSessionStats(room) {
        const questions = room.questions || []
        
        let globalCorrect = 0;
        let globalAnswered = 0;
        let globalTime = 0;
        
        const perQuestion = questions.map((q, qi) => {
            const stats = computeStats(room, qi)
            globalCorrect += stats.correctCount || 0;
            globalAnswered += stats.totalAnswered || 0;
            globalTime += (stats.avgResponseTime * (stats.totalAnswered || 0)) || 0;
            
            return {
                text: q.question,
                ...stats,
                difficulty: stats.totalAnswered
                    ? Math.round((1 - stats.correctCount / stats.totalAnswered) * 100)
                    : 0,
            }
        });
        
        return {
            startedAt: room.startedAt || new Date(Date.now() - 300000).toISOString(),
            endedAt: new Date().toISOString(),
            totalPlayers: Array.from(room.players.values()).filter(p => p.connected).length,
            totalQuestions: questions.length,
            perQuestion,
            global: {
                correctCount: globalCorrect,
                totalAnswered: globalAnswered,
                avgResponseTime: globalAnswered ? Math.round(globalTime / globalAnswered) : 0
            },
            mvp: getLeaderboard(room)[0] || null,
        }
    }

    const FUN_FACTS = [
        '🧠 The human brain can hold about 2.5 petabytes of information.',
        '🌍 A day on Venus is longer than a year on Venus.',
        '🐙 Octopuses have three hearts.',
        '🎵 Music triggers the same brain reward circuits as food and sex.',
        '⚡ Lightning strikes Earth about 100 times per second.',
        '🐦 A group of flamingos is called a "flamboyance".',
        '🌊 The ocean produces 50% of Earth\'s oxygen.',
    ]
    function getRandomFact() {
        return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]
    }

    // ─────────────────────────────────────────────
    // SERVER STARTUP
    // ─────────────────────────────────────────────
    httpServer.once('error', (err) => {
        console.error('❌ Server error:', err)
        process.exit(1)
    })

    httpServer.listen(port, async () => {
        console.log('\n🔍 Testing Connections...')
        try {
            const admin = require('firebase-admin')
            const rawAccount = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            if (rawAccount && admin.apps.length === 0) {
                let cleanJson = rawAccount.trim()
                if (cleanJson.startsWith("'") && cleanJson.endsWith("'"))
                    cleanJson = cleanJson.slice(1, -1)
                else if (cleanJson.startsWith('"') && cleanJson.endsWith('"'))
                    cleanJson = cleanJson.slice(1, -1)
                const sa = JSON.parse(cleanJson)
                if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n')
                admin.initializeApp({ credential: admin.credential.cert(sa) })
            } else if (admin.apps.length === 0) {
                admin.initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })
            }
            await admin.firestore().collection('users').limit(1).get()
            console.log('✅ Database (Firebase Firestore): Connected')
        } catch (e) {
            console.error('❌ Database (Firebase Firestore):', e.message)
        }

        console.log(`
╔══════════════════════════════════════╗
║                                      ║
║   🎮  Questify Server Running!      ║
║                                      ║
║   URL: http://localhost:${port}     
║                                      ║
║   📍 Presenter: /present             ║
║   🎯 Join Game: /join                ║
║   📺 Display:   /display             ║
║                                      ║
╚══════════════════════════════════════╝
        `)
    })
})

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down...')
    roomManager.rooms.forEach((_, id) => roomManager.removeRoom(id))
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down...')
    roomManager.rooms.forEach((_, id) => roomManager.removeRoom(id))
    process.exit(0)
})
