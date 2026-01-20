const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')
const QUIZ_DATA = require('./app/data/quiz.js')
const { PrismaClient } = require('@prisma/client')
const Redis = require('ioredis')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Floating Animation Config
const FLOATING_CONFIG = {
    MIN_SIZE: 80,
    MAX_SIZE: 150,
    MIN_SPEED: 0.3,
    MAX_SPEED: 1.5
}

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

class RoomManager {
    constructor() { this.rooms = new Map() }

    createRoom(id, hostId, questions) {
        this.rooms.set(id, {
            host: hostId,
            players: new Map(),
            gameState: 'waiting',
            currentQ: -1,
            qStartTime: 0,
            timers: { main: null, phase: null },
            lastQuestion: null,
            createdAt: Date.now(),
            questions: questions || null
        })
        return this.rooms.get(id)
    }

    getRoom(id) { return this.rooms.get(id) }

    removeRoom(id) {
        const room = this.rooms.get(id)
        if (room) {
            // Clear all timers properly
            if (room.timers.main) clearTimeout(room.timers.main)
            if (room.timers.phase) clearTimeout(room.timers.phase)
            this.rooms.delete(id)
            console.log(`🗑️  Room ${id} removed`)
        }
    }

    // Clean up old empty rooms (prevent memory leaks)
    cleanup() {
        const now = Date.now()
        const ROOM_TIMEOUT = 3600000 // 1 hour

        for (const [id, room] of this.rooms.entries()) {
            const isEmpty = Array.from(room.players.values()).every(p => !p.connected)
            const isOld = (now - room.createdAt) > ROOM_TIMEOUT

            if ((isEmpty && !room.host) || isOld) {
                this.removeRoom(id)
            }
        }
    }
}

const roomManager = new RoomManager()

// Cleanup every 10 minutes
setInterval(() => {
    console.log('🧹 Running room cleanup...')
    roomManager.cleanup()
}, 600000)

app.prepare().then(() => {
    const httpServer = createServer(handler)
    const io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
        pingTimeout: 60000,
        pingInterval: 25000
    })

    io.on('connection', (socket) => {
        console.log('👤 Client connected:', socket.id)

        // HOST EVENTS
        socket.on('host-room', (data) => {
            // Support both string (legacy) and object payload
            const roomId = typeof data === 'object' ? data.roomCode : data
            const questions = typeof data === 'object' ? data.questions : QUIZ_DATA

            console.log('🎯 Host joining room:', roomId)
            socket.join(roomId)
            socket.data = { role: 'host', roomId }

            let room = roomManager.getRoom(roomId)
            if (!room) {
                room = roomManager.createRoom(roomId, socket.id, questions)
                console.log('📦 New room created:', roomId)
            } else {
                room.host = socket.id
                // Update questions if provided (e.g. re-hosting)
                if (questions) {
                    room.questions = questions
                }
            }

            socket.emit('players-list', Array.from(room.players.values()).filter(p => p.connected))
        })

        socket.on('start-game', (data) => {
            // Handle both string and object
            const roomId = typeof data === 'object' ? data.roomCode : data

            const room = roomManager.getRoom(roomId)
            if (room && room.host === socket.id) {
                console.log('🎮 Starting game in room:', roomId)

                // Reset all player stats
                room.players.forEach(p => {
                    p.score = 0
                    p.lastPoints = 0
                    p.streak = 0
                    p.hasAnswered = false
                    p.lastCorrect = false
                })

                room.currentQ = -1
                runGameLoop(roomId, io)
            } else {
                console.log('❌ Start Game Failed:', {
                    roomId,
                    roomExists: !!room,
                    hostId: room ? room.host : 'N/A',
                    socketId: socket.id
                })
            }
        })

        socket.on('end-game', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (room && room.host === socket.id) {
                console.log('🏁 Ending game in room:', roomId)

                // Clear timers
                if (room.timers.main) clearTimeout(room.timers.main)
                if (room.timers.phase) clearTimeout(room.timers.phase)

                room.gameState = 'finished'
                io.to(roomId).emit('game-state', {
                    state: 'finished',
                    leaderboard: getLeaderboard(room)
                })
            }
        })

        socket.on('next-question', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (room && room.host === socket.id) {
                runGameLoop(roomId, io)
            }
        })

        socket.on('show-leaderboard', (roomId) => {
            const room = roomManager.getRoom(roomId)
            if (room && room.host === socket.id) {
                room.gameState = 'leaderboard'
                io.to(roomId).emit('game-state', {
                    state: 'leaderboard',
                    leaderboard: getLeaderboard(room)
                })
            }
        })

        // PLAYER EVENTS
        socket.on('join-room', ({ roomId, name, color, avatar, playerId }) => {
            console.log('🎮 Player joining:', { roomId, name, playerId })

            let room = roomManager.getRoom(roomId)
            if (!room) {
                // If player joins before host, create room with default/empty questions
                room = roomManager.createRoom(roomId, null, QUIZ_DATA)
            }

            // Generate Random Physics
            const size = Math.floor(Math.random() * (FLOATING_CONFIG.MAX_SIZE - FLOATING_CONFIG.MIN_SIZE) + FLOATING_CONFIG.MIN_SIZE)
            const speed = Math.random() * (FLOATING_CONFIG.MAX_SPEED - FLOATING_CONFIG.MIN_SPEED) + FLOATING_CONFIG.MIN_SPEED
            const angle = Math.random() * Math.PI * 2
            const vx = Math.cos(angle) * speed
            const vy = Math.sin(angle) * speed

            // Check for rejoin
            let existingPlayer = null
            let oldSocketId = null
            for (const [sid, p] of room.players.entries()) {
                if (p.playerId === playerId) {
                    existingPlayer = p
                    oldSocketId = sid
                    break
                }
            }

            socket.join(roomId)
            socket.data = { role: 'player', roomId }

            if (existingPlayer) {
                console.log('🔄 Rejoining player:', name)
                room.players.delete(oldSocketId)
                existingPlayer.id = socket.id
                existingPlayer.connected = true
                room.players.set(socket.id, existingPlayer)

                const questions = room.questions || QUIZ_DATA
                // Sync state
                socket.emit('game-state', {
                    state: room.gameState,
                    questionText: room.gameState !== 'waiting' ? questions[room.currentQ]?.question : null,
                    answers: (room.gameState === 'reading' || room.gameState === 'answering' || room.gameState === 'result') ? questions[room.currentQ]?.answers : [],
                    score: existingPlayer.score
                })
            } else {
                console.log('✨ New player:', name)
                const newPlayer = {
                    id: socket.id,
                    playerId: playerId || socket.id,
                    name,
                    color,
                    avatar: avatar || '🙂',
                    score: 0,
                    lastPoints: 0,
                    streak: 0,
                    hasAnswered: false,
                    connected: true,
                    lastCorrect: false,
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 80 + 10,
                    size, vx, vy
                }
                room.players.set(socket.id, newPlayer)
                socket.to(roomId).emit('player-joined', newPlayer)

                const questions = room.questions || QUIZ_DATA
                // Sync state for late joiners
                if (room.gameState !== 'waiting') {
                    socket.emit('game-state', {
                        state: room.gameState,
                        questionText: questions[room.currentQ]?.question,
                        answers: (room.gameState === 'reading' || room.gameState === 'answering' || room.gameState === 'result') ? questions[room.currentQ]?.answers : [],
                        score: 0
                    })
                }
            }

            console.log('📤 Emitting room-joined')
            socket.emit('room-joined', {
                playerCount: room.players.size,
                playerId: playerId || socket.id
            })
            io.to(roomId).emit('player-count-update', Array.from(room.players.values()).filter(p => p.connected).length)
            console.log('✅ Join complete. Players:', room.players.size)
        })

        socket.on('submit-answer', ({ roomId, answerIndex }) => {
            const room = roomManager.getRoom(roomId)
            if (!room || room.gameState !== 'answering') {
                console.log('⚠️  Invalid answer submission:', { roomId, gameState: room?.gameState })
                return
            }

            const player = room.players.get(socket.id)
            if (!player || player.hasAnswered) {
                console.log('⚠️  Player already answered:', player?.name)
                return
            }

            const questions = room.questions || QUIZ_DATA
            player.hasAnswered = true
            const question = questions[room.currentQ]
            const isCorrect = question.answers[answerIndex]?.correct
            let points = 0

            if (isCorrect) {
                const timeTaken = (Date.now() - room.qStartTime) / 1000
                const timeBonus = Math.max(0, 1 - (timeTaken / question.time))
                points = Math.round(500 + (500 * timeBonus))
                player.streak++
                const streakBonus = Math.min(player.streak * 100, 500)
                points += streakBonus
                console.log('✅ Correct answer:', { player: player.name, points, streak: player.streak })
            } else {
                player.streak = 0
                console.log('❌ Wrong answer:', player.name)
            }

            player.score += points
            player.lastPoints = points
            player.lastCorrect = isCorrect
            socket.emit('answer-received')
        })

        socket.on('disconnect', () => {
            console.log('👋 Client disconnected:', socket.id)
            const { roomId, role } = socket.data || {}
            if (!roomId || !role) return

            const room = roomManager.getRoom(roomId)
            if (!room) return

            if (role === 'player') {
                const p = room.players.get(socket.id)
                if (p) {
                    p.connected = false
                    console.log('📴 Player disconnected:', p.name)
                    socket.to(roomId).emit('player-left', socket.id)
                    io.to(roomId).emit('player-count-update',
                        Array.from(room.players.values()).filter(pl => pl.connected).length
                    )
                }
            } else if (role === 'host') {
                console.log('📴 Host disconnected from room:', roomId)
                // Notify players
                io.to(roomId).emit('host-disconnected')
            }
        })
    })

    function runGameLoop(roomId, io) {
        const room = roomManager.getRoom(roomId)
        if (!room) {
            console.log('⚠️  Room not found:', roomId)
            return
        }

        const questions = room.questions || QUIZ_DATA

        room.currentQ++
        console.log(`📊 Question ${room.currentQ + 1}/${questions.length}`)

        if (room.currentQ >= questions.length) {
            room.gameState = 'finished'
            io.to(roomId).emit('game-state', {
                state: 'finished',
                leaderboard: getLeaderboard(room)
            })
            console.log('🏁 Game finished in room:', roomId)
            return
        }

        const question = questions[room.currentQ]
        room.players.forEach(p => {
            p.hasAnswered = false
            p.lastCorrect = false
            p.lastPoints = 0
        })

        // READING PHASE
        room.gameState = 'reading'
        io.to(roomId).emit('game-state', {
            state: 'reading',
            questionText: question.question,
            answers: question.answers,
            qIndex: room.currentQ + 1,
            totalQ: questions.length,
            duration: 5
        })
        console.log('📖 Reading phase started')

        room.timers.main = setTimeout(() => {
            // ANSWERING PHASE
            room.gameState = 'answering'
            room.qStartTime = Date.now()
            io.to(roomId).emit('game-state', {
                state: 'answering',
                questionText: question.question,
                answers: question.answers,
                duration: question.time
            })
            const duration = question.time || 20
            console.log('⏱️  Answering phase started:', duration, 'seconds')

            room.timers.phase = setTimeout(() => {
                // RESULT PHASE
                room.gameState = 'result'

                // Send individual feedback
                room.players.forEach(p => {
                    if (p.connected) {
                        io.to(p.id).emit('round-feedback', {
                            correct: p.lastCorrect,
                            points: p.lastPoints,
                            score: p.score,
                            streak: p.streak
                        })
                    }
                })

                // Send result to all
                io.to(roomId).emit('game-state', {
                    state: 'result',
                    correctIndex: question.answers.findIndex(a => a.correct),
                    questionText: question.question,
                    answers: question.answers,
                    leaderboard: getLeaderboard(room)
                })
                console.log('📊 Results shown')
            }, duration * 1000)
        }, 5000)
    }

    function getLeaderboard(room) {
        const leaderboard = Array.from(room.players.values())
            .filter(p => p.connected)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10) // Show top 10 instead of 5

        console.log('🏆 Leaderboard:', leaderboard.map(p => `${p.name}: ${p.score}`).join(', '))
        return leaderboard
    }

    httpServer.once('error', (err) => {
        console.error('❌ Server error:', err)
        process.exit(1)
    })

    httpServer.listen(port, async () => {
        // Test Connections
        console.log('\n🔍 Testing Connections...')
        try {
            const { PrismaClient } = require('@prisma/client')
            const prisma = new PrismaClient()
            await prisma.$connect()
            console.log('✅ Database (Prisma): Connected')
            await prisma.$disconnect()
        } catch (e) {
            console.error('❌ Database (Prisma): Failed', e.message)
        }

        try {
            const Redis = require('ioredis')
            const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
                maxRetriesPerRequest: 0,
                retryStrategy: () => null, // Don't retry
                lazyConnect: true
            })
            await redis.connect() // Explicit connect for lazyConnect
            console.log('✅ Cache (Redis): Connected')
            redis.disconnect()
        } catch (e) {
            console.error('❌ Cache (Redis): Failed -', e.message)
            console.log('   (Redis is likely not running. Install it or check port 6379)')
        }

        console.log(`
╔══════════════════════════════════════╗
║                                      ║
║   🎮  Questify Server Running!      ║
║                                      ║
║   URL: http://${hostname}:${port}     
║                                      ║
║   📍 Presenter: /present             ║
║   🎯 Join Game: /join                ║
║                                      ║
╚══════════════════════════════════════╝
        `)
    })
})

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...')
    roomManager.rooms.forEach((room, id) => roomManager.removeRoom(id))
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully...')
    roomManager.rooms.forEach((room, id) => roomManager.removeRoom(id))
    process.exit(0)
})
