'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionCard from '../components/game/QuestionCard'
import AnswerGrid from '../components/game/AnswerGrid'
import confetti from 'canvas-confetti'

interface Player { id: string; name: string; color: string; avatar: string; score: number; lastPoints: number; x: number; y: number; vx: number; vy: number; size?: number; }
interface Answer { text: string; color: string; icon: string; }
type GameState = 'waiting' | 'reading' | 'answering' | 'result' | 'leaderboard' | 'finished'

export default function PresenterView() {
    const [players, setPlayers] = useState<Player[]>([])
    const [roomCode] = useState('482519')
    const [gameState, setGameState] = useState<GameState>('waiting')
    const [socket, setSocket] = useState<Socket | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const animRef = useRef<number>()

    // Game Data
    const [qText, setQText] = useState('')
    const [answers, setAnswers] = useState<Answer[]>([])
    const [timeLeft, setTimeLeft] = useState(0)
    const [correctIdx, setCorrectIdx] = useState(-1)
    const [qNum, setQNum] = useState(0)
    const [totalQ, setTotalQ] = useState(0)
    const [leaderboard, setLeaderboard] = useState<Player[]>([])

    useEffect(() => {
        const s = io()
        setSocket(s)
        s.on('connect', () => s.emit('host-room', roomCode))
        s.on('players-list', setPlayers)
        s.on('player-joined', p => setPlayers(prev => [...prev, p]))
        s.on('player-left', id => setPlayers(prev => prev.filter(p => p.id !== id)))

        s.on('game-state', (d) => {
            setGameState(d.state)
            if (d.state === 'reading') {
                setQText(d.questionText); setQNum(d.qIndex); setTotalQ(d.totalQ); setTimeLeft(d.duration);
                // Fix: use answers sent by server instead of clearing
                setAnswers(d.answers || [])
            } else if (d.state === 'answering') {
                setQText(d.questionText); setAnswers(d.answers); setTimeLeft(d.duration)
            } else if (d.state === 'result') {
                setCorrectIdx(d.correctIndex); setLeaderboard(d.leaderboard); setQText(d.questionText); setAnswers(d.answers)
            } else if (d.state === 'leaderboard' || d.state === 'finished') {
                setLeaderboard(d.leaderboard)
                if (d.state === 'finished') {
                    const end = Date.now() + 3000
                    const colors = ['#bb0000', '#ffffff']
                        ; (function frame() {
                            confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: colors })
                            confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: colors })
                            if (Date.now() < end) requestAnimationFrame(frame)
                        }())
                }
            }
        })
        return () => { s.disconnect() }
    }, [roomCode])

    // Timer
    useEffect(() => {
        if (timeLeft > 0 && (gameState === 'reading' || gameState === 'answering')) {
            const t = setInterval(() => setTimeLeft(p => p - 1), 1000)
            return () => clearInterval(t)
        }
    }, [timeLeft, gameState])

    // Floating Animation
    useEffect(() => {
        const loop = () => {
            if (gameState !== 'waiting') return
            const cont = containerRef.current
            if (!cont) { animRef.current = requestAnimationFrame(loop); return }
            setPlayers(prev => prev.map(p => {
                let { x, y, vx, vy, size } = p
                const s = size || 80 // Default size

                x += vx || 0.5; y += vy || 0.5

                // Bounce logic
                if (x <= 0 || x >= cont.clientWidth - s) vx *= -1
                if (y <= 0 || y >= cont.clientHeight - s) vy *= -1

                return { ...p, x, y, vx, vy }
            }))
            animRef.current = requestAnimationFrame(loop)
        }
        animRef.current = requestAnimationFrame(loop)
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
    }, [gameState])

    const handleNext = () => {
        if (gameState === 'waiting') socket?.emit('start-game', roomCode)
        else if (gameState === 'result') socket?.emit('show-leaderboard', roomCode)
        else if (gameState === 'leaderboard') socket?.emit('next-question', roomCode)
    }

    // --- VIEWS ---

    const WaitingView = () => (
        <div ref={containerRef} className="flex-1 relative bg-slate-900 overflow-hidden">
            {players.map(p => (
                <div
                    key={p.id}
                    style={{
                        transform: `translate(${p.x}px, ${p.y}px)`,
                        width: p.size ? `${p.size}px` : undefined,
                        height: p.size ? `${p.size}px` : undefined
                    }}
                    className={`absolute rounded-full ${p.color} flex items-center justify-center shadow-lg border-4 border-white/20 ${!p.size ? 'w-16 h-16 md:w-24 md:h-24' : ''}`}
                >
                    <span
                        className="drop-shadow-md"
                        style={{ fontSize: p.size ? `${p.size * 0.5}px` : undefined }}
                    >
                        {p.avatar || '🙂'}
                    </span>
                    <span className="absolute -bottom-6 text-white font-bold bg-black/50 px-2 rounded text-[10px] md:text-xs truncate max-w-[80px] md:max-w-[100px]">{p.name}</span>
                </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <div className="text-center w-full max-w-lg">
                    <h1 className="text-3xl md:text-6xl font-black text-white mb-4">Join at questify.app</h1>
                    <div className="bg-white text-slate-900 inline-block px-6 py-4 md:px-12 md:py-6 rounded-2xl w-full">
                        <span className="text-lg md:text-2xl font-bold uppercase block text-slate-500 mb-2">Game PIN</span>
                        <span className="text-5xl md:text-8xl font-black tracking-widest">{roomCode}</span>
                    </div>
                </div>
            </div>
        </div>
    )

    const GameView = () => (
        <div className="flex-1 bg-slate-900 p-4 md:p-8 flex flex-col relative h-full">
            <div className="flex justify-between items-center mb-4 md:mb-8 h-16 md:h-20">
                <span className="text-white/50 font-bold text-lg md:text-2xl uppercase tracking-wider">{qNum} of {totalQ}</span>
                {gameState === 'answering' && (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-2xl md:text-3xl border-4 border-indigo-400">{timeLeft}</div>
                )}
            </div>
            <div className="flex-1 flex flex-col gap-4 md:gap-8 min-h-0">
                <div className="flex-shrink-0">
                    <QuestionCard text={qText} className="flex-grow-[1]" />
                </div>
                <div className="flex-grow-[2] relative min-h-0">
                    {gameState === 'reading' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-full max-w-4xl h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden mb-4 md:mb-6"><motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear" }} className="h-full bg-indigo-500" /></div>
                            <p className="text-lg md:text-2xl text-slate-400 font-bold uppercase tracking-widest">Reading Phase</p>
                            {/* Hidden answer grid to pre-load for smoothness (opacity handled inside if needed, or just let it sit behind?)
                                  Actually, existing logic puts Reading overlay via ternary.
                                  If we want NO blink, we might want to render AnswerGrid BEHIND the reading overlay?
                                  Let's keep it simple: server sends answers. Client sets state.
                                  Effectively, answers are READY.
                                  But the UI only Shows AnswerGrid in 'else' block below.
                                  The blink comes from AnswerGrid MOUNTING.
                                  To fix mount blink, we should Render AnswerGrid ALWAYS, but overlay Reading on top.
                               */}

                            <div className="absolute inset-0 -z-10 opacity-0">
                                {/* Pre-render to warm up? No, that's complex. 
                                      The user said "options should not blink".
                                      Usually this means they want to SEE the options while Reading.
                                      If so, I should just render AnswerGrid below Reading bar?
                                      Let's assume "Don't blink" means "Show immediately". 
                                      So I will remove the ternary and just show AnswerGrid below the reading bar.
                                  */}
                            </div>
                        </div>
                    ) : null}

                    {/* Render AnswerGrid if answers exist, regardless of Reading/Answering */}
                    {answers.length > 0 && (
                        <div className={gameState === 'reading' ? 'opacity-50 pointer-events-none filter grayscale' : ''}>
                            <AnswerGrid answers={answers} revealed={gameState === 'result'} correctIndex={correctIdx} disabled={true} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    const PodiumView = () => {
        const top3 = leaderboard.slice(0, 3)
        const first = top3[0]; const second = top3[1]; const third = top3[2]

        return (
            <div className="flex-1 bg-indigo-900 flex flex-col items-center justify-center relative overflow-hidden p-4">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-8 md:mb-12 relative z-10 text-center">The Winners</h1>
                <div className="flex items-end justify-center gap-2 md:gap-4 relative z-10 h-[300px] md:h-[500px] w-full max-w-3xl">
                    {/* 2nd */}
                    {second && (
                        <div className="flex flex-col items-center w-1/3">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center mb-2 md:mb-4">
                                <span className="text-4xl md:text-6xl mb-1 md:mb-2">{second.avatar}</span>
                                <span className="text-white font-bold text-sm md:text-xl truncate max-w-full text-center">{second.name}</span>
                                <span className="text-indigo-300 font-bold text-sm md:text-base">{second.score}</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} transition={{ duration: 1, delay: 0.5 }} className="w-full max-w-[100px] md:max-w-[160px] bg-zinc-400 rounded-t-lg flex flex-col items-center justify-start p-2 md:p-4 border-t-4 md:border-t-8 border-zinc-300 h-[150px] md:h-[250px]">
                                <span className="text-4xl md:text-6xl font-black text-zinc-600 block mt-2 md:mt-4">2</span>
                            </motion.div>
                        </div>
                    )}
                    {/* 1st */}
                    {first && (
                        <div className="flex flex-col items-center w-1/3 relative -top-4 md:-top-10">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5 }} className="flex flex-col items-center mb-2 md:mb-4">
                                <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity }} className="text-2xl md:text-3xl absolute -top-8 md:-top-12">👑</motion.span>
                                <span className="text-6xl md:text-8xl mb-1 md:mb-2">{first.avatar}</span>
                                <span className="text-white font-bold text-lg md:text-2xl truncate max-w-full text-center">{first.name}</span>
                                <span className="text-yellow-400 font-bold text-base md:text-xl">{first.score}</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '60%' }} transition={{ duration: 1, delay: 1.5 }} className="w-full max-w-[120px] md:max-w-[190px] bg-yellow-500 rounded-t-lg flex flex-col items-center justify-start p-2 md:p-4 border-t-4 md:border-t-8 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)] h-[200px] md:h-[350px]">
                                <span className="text-6xl md:text-8xl font-black text-yellow-700 block mt-4 md:mt-8">1</span>
                            </motion.div>
                        </div>
                    )}
                    {/* 3rd */}
                    {third && (
                        <div className="flex flex-col items-center w-1/3">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.0 }} className="flex flex-col items-center mb-2 md:mb-4">
                                <span className="text-4xl md:text-6xl mb-1 md:mb-2">{third.avatar}</span>
                                <span className="text-white font-bold text-sm md:text-xl truncate max-w-full text-center">{third.name}</span>
                                <span className="text-amber-700 font-bold text-sm md:text-base">{third.score}</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} transition={{ duration: 1, delay: 1.0 }} className="w-full max-w-[100px] md:max-w-[160px] bg-amber-700 rounded-t-lg flex flex-col items-center justify-start p-2 md:p-4 border-t-4 md:border-t-8 border-amber-600 h-[100px] md:h-[180px]">
                                <span className="text-4xl md:text-6xl font-black text-amber-900 block mt-2 md:mt-4">3</span>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const LeaderboardView = () => (
        <div className="flex-1 bg-indigo-900 p-4 md:p-12 flex flex-col items-center ">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-6 md:mb-12">Leaderboard</h1>
            <div className="w-full max-w-4xl space-y-3 md:space-y-4">
                <AnimatePresence>
                    {leaderboard.map((p, i) => (
                        <motion.div
                            key={p.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center shadow-xl transform"
                        >
                            <div className="w-8 md:w-16 text-xl md:text-4xl font-black text-slate-300">#{i + 1}</div>
                            <div className="flex-1 flex items-center gap-3 md:gap-6">
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full ${p.color} border-2 md:border-4 border-white shadow-sm flex items-center justify-center text-xl md:text-3xl`}>{p.avatar}</div>
                                <span className="text-xl md:text-3xl font-bold text-slate-800 truncate">{p.name}</span>
                            </div>
                            <div className="text-2xl md:text-4xl font-black text-indigo-600">{p.score}</div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )

    const isGameActive = gameState === 'reading' || gameState === 'answering' || gameState === 'result'

    return (
        <div className="h-screen flex flex-col font-sans overflow-hidden bg-slate-900">
            {gameState === 'waiting' && <WaitingView />}
            {isGameActive && <GameView />}
            {gameState === 'leaderboard' && <LeaderboardView />}
            {gameState === 'finished' && <PodiumView />}

            {gameState !== 'finished' && (
                <div className="bg-white border-t border-slate-200 flex flex-col md:flex-row items-center justify-between px-4 py-2 md:px-10 md:py-0 md:h-24 z-50 shrink-0 gap-2">
                    <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
                        <div className="bg-slate-100 px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold text-slate-600 text-sm md:text-lg">{players.length} Players</div>
                        <div className="text-slate-400 font-bold uppercase tracking-wide text-xs md:text-base">{gameState}</div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                        {gameState !== 'waiting' && (
                            <button
                                onClick={() => socket?.emit('end-game', roomCode)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 md:px-8 md:py-5 rounded-lg md:rounded-xl font-bold text-sm md:text-xl shadow-xl transition-all active:scale-95 flex-1 md:flex-none whitespace-nowrap"
                            >
                                End Game
                            </button>
                        )}
                        {(gameState === 'waiting' || gameState === 'result' || gameState === 'leaderboard') && (
                            <button onClick={handleNext} className="bg-black hover:bg-slate-800 text-white px-6 py-3 md:px-12 md:py-5 rounded-lg md:rounded-xl font-bold text-sm md:text-xl shadow-xl flex items-center justify-center gap-2 md:gap-3 flex-1 md:flex-none whitespace-nowrap">
                                {gameState === 'waiting' ? 'Start Game' : gameState === 'leaderboard' ? 'Next' : 'Leaderboard'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
