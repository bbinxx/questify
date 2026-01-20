'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import QuestionCard from '../components/game/QuestionCard'
import AnswerGrid from '../components/game/AnswerGrid'

const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500']
const avatars = ['🦁', '🦊', '🐼', '🐨', '🐯', '🐙', '🦄', '🐲']

const FUNNY_PHRASES = [
    "Look at the big screen! No peeking!",
    "Are you winning son?",
    "Calculations in progress... (not really)",
    "Plot twist: The points are made up.",
    "Breathe in... Breathe out...",
    "Manifesting victory...",
    "Don't blame lag if you're losing.",
    "Preparing the confetti...",
    "Checking who paid the host...",
    "Loading witty remark..."
]

type GameState = 'waiting' | 'reading' | 'answering' | 'result' | 'leaderboard' | 'finished'

export default function JoinRoom() {
    const [step, setStep] = useState<'code' | 'name' | 'game'>('code')
    const [gameState, setGameState] = useState<GameState>('waiting')
    const [roomCode, setRoomCode] = useState('')
    const [name, setName] = useState('')
    const [myAvatar, setMyAvatar] = useState(avatars[0])
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isJoining, setIsJoining] = useState(false)

    const myColor = useMemo(() => colors[Math.floor(Math.random() * colors.length)], [])

    const [funnyMsg, setFunnyMsg] = useState(FUNNY_PHRASES[0])
    const [error, setError] = useState('')
    const [qText, setQText] = useState('')
    const [answers, setAnswers] = useState<any[]>([])
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [result, setResult] = useState<{ correct: boolean; points: number; score: number; streak: number } | null>(null)
    const [score, setScore] = useState(0)
    const [hasAnswered, setHasAnswered] = useState(false)
    const [answeredIndex, setAnsweredIndex] = useState(-1)
    const [correctIndex, setCorrectIndex] = useState(-1)

    useEffect(() => {
        const s = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        })
        setSocket(s)

        s.on('connect', () => {
            console.log('✅ Connected to server')
            setError('')
        })

        s.on('disconnect', () => console.log('❌ Disconnected'))
        s.on('connect_error', () => setError('Connection error. Retrying...'))

        s.on('room-joined', (data) => {
            console.log('✅ Room joined:', data)
            setStep('game')
            setGameState('waiting')
            setError('')
            setIsJoining(false)
        })

        s.on('game-state', (data) => {
            console.log('📊 Game state:', data.state)
            setGameState(data.state)

            switch (data.state) {
                case 'reading':
                    setQText(data.questionText)
                    // Don't show answers during reading - they'll appear in answering phase
                    setAnswers([])
                    setHasAnswered(false)
                    setAnsweredIndex(-1)
                    setResult(null)
                    setCorrectIndex(-1)
                    break

                case 'answering':
                    setAnswers(data.answers)
                    setQText(data.questionText)
                    break

                case 'result':
                    setCorrectIndex(data.correctIndex)
                    break

                case 'leaderboard':
                    setFunnyMsg(FUNNY_PHRASES[Math.floor(Math.random() * FUNNY_PHRASES.length)])
                    // Clear question/answers for clean leaderboard view
                    setQText('')
                    setAnswers([])
                    break

                case 'waiting':
                    setQText('')
                    setAnswers([])
                    setResult(null)
                    setHasAnswered(false)
                    setAnsweredIndex(-1)
                    setCorrectIndex(-1)
                    break
            }

            if (data.leaderboard) setLeaderboard(data.leaderboard)
            if (data.score !== undefined) setScore(data.score)
        })

        s.on('answer-received', () => setHasAnswered(true))

        s.on('round-feedback', (data) => {
            setResult(data)
            setScore(data.score)
            if (data.correct) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#10b981', '#fbbf24']
                })
            }
        })

        return () => { s.disconnect() }
    }, [])

    const handleNextStep = useCallback(() => {
        const trimmedCode = roomCode.trim()
        if (trimmedCode.length < 4) {
            setError('Please enter a valid PIN')
            return
        }
        setError('')
        setStep('name')
    }, [roomCode])

    const joinGame = useCallback(() => {
        const trimmedName = name.trim()
        const trimmedCode = roomCode.trim()

        console.log('🎮 Joining...', { trimmedCode, trimmedName })

        if (!trimmedCode || trimmedCode.length < 4) {
            setError('Invalid room code')
            return
        }

        if (!trimmedName || trimmedName.length < 1) {
            setError('Please enter a name')
            return
        }

        if (!socket) {
            setError('Socket not initialized')
            return
        }

        if (!socket.connected) {
            setError('Not connected. Retrying...')
            setTimeout(() => socket.connected && joinGame(), 1000)
            return
        }

        setError('')
        setIsJoining(true)

        console.log('📤 Emitting join-room...')
        socket.emit('join-room', {
            roomId: trimmedCode,
            name: trimmedName,
            color: myColor,
            avatar: myAvatar,
        })

        setTimeout(() => {
            if (step === 'name') {
                console.log('⚠️ Timeout')
                setIsJoining(false)
                setError('Failed to join. Try again.')
            }
        }, 5000)
    }, [name, roomCode, myColor, myAvatar, socket, step])

    const submitAnswer = useCallback((idx: number) => {
        if (!hasAnswered && gameState === 'answering' && socket) {
            setHasAnswered(true)
            setAnsweredIndex(idx)
            socket.emit('submit-answer', { roomId: roomCode, answerIndex: idx })
        }
    }, [hasAnswered, gameState, socket, roomCode])

    const WaitingScreen = useMemo(() => (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900">
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-36 h-36 rounded-full ${myColor} flex items-center justify-center mb-8 shadow-2xl ring-4 ring-slate-800 text-6xl`}
            >
                {myAvatar}
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">You're in!</h2>
            <div className="mt-auto bg-slate-800/50 rounded-xl px-6 py-3 border border-slate-700">
                <p className="text-slate-400 text-xs text-center">JOINED AS</p>
                <p className="text-white font-bold text-lg">{name}</p>
            </div>
        </div>
    ), [myColor, myAvatar, name])

    const ActiveGameScreen = () => (
        <div className="flex flex-col h-full bg-slate-900 p-4 md:p-6 pb-20 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="text-white font-bold bg-slate-800 px-4 py-2 rounded-lg">{score} pts</div>
                <div className="text-slate-400 text-sm font-medium uppercase tracking-widest">{gameState}</div>
            </div>
            <div className="mb-6 flex-shrink-0">
                <QuestionCard text={qText} className="min-h-[160px]" />
            </div>
            <div className={`flex-1 flex flex-col ${gameState === 'reading' ? 'justify-center items-center' : ''}`}>
                {gameState === 'reading' && (
                    <div className="text-center">
                        <span className="text-6xl mb-4 block animate-bounce">👀</span>
                        <p className="text-slate-400 font-medium">Get ready...</p>
                    </div>
                )}
                {/* Only show answers during answering and result phases */}
                {(gameState === 'answering' || gameState === 'result') && answers.length > 0 && (
                    <AnswerGrid
                        answers={answers}
                        showText={true}
                        disabled={hasAnswered || gameState !== 'answering'}
                        onAnswerClick={submitAnswer}
                        revealed={gameState === 'result'}
                        correctIndex={correctIndex}
                        selectedIndex={answeredIndex}
                    />
                )}
            </div>
            <AnimatePresence>
                {gameState === 'result' && result && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`fixed bottom-4 left-4 right-4 p-4 rounded-xl flex items-center justify-between shadow-2xl z-50 ${result.correct ? 'bg-emerald-600' : 'bg-rose-600'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-full">
                                <span className="text-2xl">{result.correct ? '✓' : '✗'}</span>
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">{result.correct ? 'Correct!' : 'Incorrect'}</p>
                                {result.correct && <p className="text-white/80 text-sm">+{result.points} pts</p>}
                            </div>
                        </div>
                        <div className="text-white font-black text-2xl">{score}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )

    if (step !== 'game') return (
        <div className="h-screen bg-slate-900 flex flex-col p-6 items-center justify-center">
            <div className="w-full max-w-sm space-y-6">
                <h1 className="text-3xl font-black text-white text-center">
                    {step === 'code' ? 'Join Game' : 'Create Profile'}
                </h1>

                {step === 'code' ? (
                    <input
                        type="text"
                        placeholder="Enter PIN"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value.toUpperCase())}
                        onKeyPress={e => e.key === 'Enter' && handleNextStep()}
                        maxLength={6}
                        className="w-full bg-slate-800 text-white text-3xl font-bold text-center py-6 rounded-2xl border-2 border-slate-700 outline-none focus:border-indigo-500 transition-colors"
                    />
                ) : (
                    <div className="space-y-6">
                        <input
                            type="text"
                            placeholder="Enter Nickname"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && joinGame()}
                            maxLength={20}
                            className="w-full bg-slate-800 text-white text-xl font-bold text-center py-4 rounded-2xl border-2 border-slate-700 outline-none focus:border-indigo-500 transition-colors"
                        />
                        <div className="grid grid-cols-4 gap-2">
                            {avatars.map(av => (
                                <button
                                    key={av}
                                    onClick={() => setMyAvatar(av)}
                                    className={`text-3xl p-3 rounded-xl transition-all ${myAvatar === av ? 'bg-indigo-600 scale-110 shadow-lg' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={step === 'code' ? handleNextStep : joinGame}
                    disabled={isJoining || (step === 'code' ? roomCode.trim().length < 4 : name.trim().length < 1)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold text-xl shadow-lg mt-6 transition-all active:scale-95"
                >
                    {isJoining ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Joining...
                        </span>
                    ) : (
                        step === 'code' ? "Next" : "Ready!"
                    )}
                </button>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-rose-400 text-center text-sm"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        </div>
    )

    return (
        <div className="h-[100dvh] w-full bg-slate-900 font-sans overflow-hidden">
            {gameState === 'waiting' ? WaitingScreen : <ActiveGameScreen />}

            {gameState === 'leaderboard' && (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-indigo-900 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Leaderboard</h2>
                    <p className="text-indigo-200 text-xl font-medium animate-pulse">{funnyMsg}</p>
                    <div className="mt-8 bg-indigo-800 p-6 rounded-xl">
                        <p className="text-sm text-indigo-300 uppercase">Your Score</p>
                        <p className="text-5xl font-black text-white">{score}</p>
                    </div>
                </div>
            )}

            {gameState === 'finished' && (
                <div className="h-full flex flex-col items-center justify-center text-white text-center relative overflow-hidden">
                    {!leaderboard?.some((p: any) => p.name === name) && (
                        <div className="absolute inset-0 pointer-events-none">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: -100, x: `${Math.random() * 100}%` }}
                                    animate={{ y: "100vh" }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1 + Math.random(),
                                        delay: Math.random() * 2,
                                        ease: "linear"
                                    }}
                                    className="absolute w-0.5 h-10 bg-blue-400/50"
                                />
                            ))}
                        </div>
                    )}

                    <h1 className="text-5xl font-black mb-4 z-10">Game Over</h1>
                    <p className="text-2xl z-10">Final Score: {score}</p>

                    {leaderboard?.some((p: any, i: number) => i < 3 && p.avatar === myAvatar && p.score === score) ? (
                        <div className="mt-8 z-10">
                            <h2 className="text-4xl font-bold text-yellow-400 mb-2">🏆 Top 3! 🏆</h2>
                            <p className="text-white/80">Amazing job!</p>
                        </div>
                    ) : (
                        <div className="mt-8 z-10">
                            <h2 className="text-2xl font-bold text-slate-400 mb-2">Good Effort!</h2>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
