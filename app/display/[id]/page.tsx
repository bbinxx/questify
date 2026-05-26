'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGameAudio } from '../../hooks/useGameAudio'

interface Player { id: string; name: string; color: string; avatar: string; score: number; x: number; y: number; vx: number; vy: number; size?: number; rank?: number }
interface Answer { text: string; color: string; icon: string; correct?: boolean }
type GameState = 'WAITING' | 'INTRO' | 'QUESTION_REVEAL' | 'MEDIA_FOCUS' | 'THINKING' | 'ANSWERING' | 'LOCKED' | 'RESULTS' | 'LIVE_STATS' | 'LEADERBOARD' | 'TRANSITION' | 'FINAL_RESULTS' | 'END'

export default function DisplayView() {
    const params = useParams()
    const roomCode = params.id as string

    // Connection & Setup
    const [socket, setSocket] = useState<Socket | null>(null)
    const [joinUrl, setJoinUrl] = useState('')
    
    // State
    const [gameState, setGameState] = useState<GameState>('WAITING')
    const [players, setPlayers] = useState<Player[]>([])
    
    const audio = useGameAudio()
    
    // Content
    const [quizTitle, setQuizTitle] = useState('')
    const [qText, setQText] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [questionType, setQuestionType] = useState<string>('MULTIPLE_CHOICE')
    const [answers, setAnswers] = useState<Answer[]>([])
    const [timeLeft, setTimeLeft] = useState(0)
    const [correctIdx, setCorrectIdx] = useState(-1)
    const [stats, setStats] = useState<any>(null)
    const [leaderboard, setLeaderboard] = useState<Player[]>([])
    const [funFact, setFunFact] = useState('')

    const containerRef = useRef<HTMLDivElement>(null)
    const animRef = useRef<number>()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setJoinUrl(window.location.origin + '/join')
        }

        const s = io()
        setSocket(s)
        s.emit('display-join', roomCode)

        s.on('players-list', (pList) => setPlayers(pList))
        s.on('player-joined', (p) => {
            setPlayers(prev => [...prev, p])
            audio.playJoin()
        })
        s.on('player-left', (id) => setPlayers(prev => prev.filter(p => p.id !== id)))

        s.on('game-state', (data) => {
            setGameState(data.state as GameState)
            if (data.quizTitle) setQuizTitle(data.quizTitle)
            if (data.questionText) setQText(data.questionText)
            if (data.mediaUrl !== undefined) setMediaUrl(data.mediaUrl)
            if (data.answers) setAnswers(data.answers)
            if (data.questionType) setQuestionType(data.questionType)
            if (data.duration) setTimeLeft(data.duration)
            if (data.correctIndex !== undefined) setCorrectIdx(data.correctIndex)
            if (data.stats) setStats(data.stats)
            if (data.leaderboard) setLeaderboard(data.leaderboard)
            if (data.funFact) setFunFact(data.funFact)
            
            if (data.state === 'THINKING') audio.playTension()
            if (data.state === 'LOCKED') audio.playLock()
            if (data.state === 'RESULTS') audio.playReveal()
            
            if (data.state === 'FINAL_RESULTS') {
                audio.playLevelUp()
                const colors = ['#4f46e5', '#ec4899', '#f59e0b', '#ffffff'];
                (function frame() {
                    confetti({ particleCount: 5, angle: 60, spread: 80, origin: { x: 0 }, colors: colors })
                    confetti({ particleCount: 5, angle: 120, spread: 80, origin: { x: 1 }, colors: colors })
                    if (Date.now() < Date.now() + 15000) requestAnimationFrame(frame)
                }())
            }
        })

        return () => { s.disconnect() }
    }, [roomCode])

    // Timer Logic
    useEffect(() => {
        if (timeLeft > 0 && (gameState === 'THINKING' || gameState === 'ANSWERING')) {
            const t = setInterval(() => {
                setTimeLeft(p => p - 1)
                if (gameState === 'ANSWERING') audio.playTick()
            }, 1000)
            return () => clearInterval(t)
        }
    }, [timeLeft, gameState, audio])

    // Floating Avatars in WAITING
    useEffect(() => {
        const loop = () => {
            if (gameState !== 'WAITING') return
            const cont = containerRef.current
            if (!cont) { animRef.current = requestAnimationFrame(loop); return }
            setPlayers(prev => prev.map(p => {
                let { x, y, vx, vy, size = 100 } = p
                x += vx || 0.5; y += vy || 0.5
                if (x <= 0 || x >= cont.clientWidth - size) vx *= -1
                if (y <= 0 || y >= cont.clientHeight - size) vy *= -1
                return { ...p, x, y, vx, vy }
            }))
            animRef.current = requestAnimationFrame(loop)
        }
        animRef.current = requestAnimationFrame(loop)
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
    }, [gameState])

    const QrOverlay = () => (
        <div className="absolute bottom-8 right-8 bg-white p-4 rounded-3xl shadow-2xl flex items-center gap-6 z-50">
            <div className="text-right">
                <p className="text-3xl font-bold text-slate-800 uppercase tracking-widest">Join Game</p>
                <p className="text-5xl font-black text-indigo-600 tracking-widest">{roomCode}</p>
            </div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`} alt="QR" className="w-32 h-32 rounded-xl" />
        </div>
    )

    // ── VIEW COMPONENTS ──

    const WaitingView = () => (
        <div ref={containerRef} className="flex-1 relative bg-slate-950 overflow-hidden">
            {players.map(p => (
                <div key={p.id} style={{ transform: `translate(${p.x}px, ${p.y}px)`, width: p.size, height: p.size }}
                    className={`absolute rounded-full ${p.color} flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] border-4 border-white/30`}
                >
                    <span style={{ fontSize: `${(p.size || 80) * 0.4}px` }}>{p.avatar}</span>
                    <span className="text-white font-bold bg-black/60 px-3 py-1 rounded text-lg truncate absolute -bottom-10">{p.name}</span>
                </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                <div className="text-center w-full max-w-4xl bg-black/40 backdrop-blur-xl p-16 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    <h1 className="text-7xl font-black text-white mb-12">{quizTitle || 'Welcome!'}</h1>
                    <div className="flex gap-16 items-center justify-center">
                        <div className="bg-white p-6 rounded-3xl shadow-2xl">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`} className="w-64 h-64" />
                        </div>
                        <div className="text-left">
                            <p className="text-4xl text-slate-300 font-semibold uppercase mb-2">Scan to join</p>
                            <p className="text-4xl text-slate-400 mb-8">or visit <strong className="text-white font-mono">{joinUrl || 'questify.app'}</strong></p>
                            <p className="text-3xl text-slate-400 uppercase mb-2">Game PIN</p>
                            <p className="text-9xl font-black tracking-widest text-indigo-400">{roomCode}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const GameplayView = () => {
        const isReveal = gameState === 'QUESTION_REVEAL'
        const isMedia = gameState === 'MEDIA_FOCUS'
        const isThinking = gameState === 'THINKING'
        const isAnswering = gameState === 'ANSWERING'
        const isLocked = gameState === 'LOCKED'
        const isResult = gameState === 'RESULTS' || gameState === 'LIVE_STATS'
        
        const showAnswers = isAnswering || isLocked || isResult

        if (isMedia && mediaUrl) return (
            <div className="flex-1 bg-black flex flex-col items-center justify-center p-12">
                <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }}
                    src={mediaUrl} className="w-full h-full max-h-[80vh] object-contain rounded-3xl mb-12 shadow-[0_0_100px_rgba(255,255,255,0.1)]" />
                <motion.h2 initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-6xl font-black text-white text-center px-20 leading-tight">{qText}</motion.h2>
            </div>
        )

        return (
            <div className="flex-1 bg-slate-900 p-12 flex flex-col relative h-full">
                {/* Timer Circle Top Right */}
                {(isThinking || isAnswering) && (
                    <motion.div key={gameState} initial={{ scale: 0 }} animate={{ scale: 1 }} 
                        className="absolute top-12 right-12 w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white text-6xl border-8 border-indigo-400 tabular-nums shadow-[0_0_50px_rgba(79,70,229,0.5)] z-40">
                        {timeLeft}
                    </motion.div>
                )}
                
                {/* Always show PIN on TV during game */}
                <QrOverlay />

                <div className="flex-1 flex flex-col gap-12">
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-shrink-0 bg-white rounded-3xl p-12 shadow-2xl flex items-center min-h-[250px]">
                        {mediaUrl && <img src={mediaUrl} className="w-64 h-64 object-cover rounded-2xl mr-12" />}
                        <h2 className="text-6xl md:text-7xl font-black text-slate-800 leading-tight">{qText}</h2>
                    </motion.div>

                    <div className="flex-grow-[2] relative">
                        {(isReveal || isThinking) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h3 className="text-6xl font-black text-slate-500 tracking-widest uppercase animate-pulse">
                                    {isReveal ? 'Get Ready...' : 'Think Carefully...'}
                                </h3>
                            </div>
                        )}
                        
                        {showAnswers && (
                            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className={`h-full flex items-center justify-center ${isLocked || isResult ? 'filter grayscale-[30%]' : ''}`}>
                                {questionType === 'TYPE_ANSWER' ? (
                                    <div className="bg-white rounded-3xl p-16 w-full max-w-5xl text-center shadow-[0_0_100px_rgba(255,255,255,0.1)]">
                                        <p className="text-slate-400 font-black uppercase tracking-widest mb-6 text-3xl">Correct Answer</p>
                                        <h2 className={`text-8xl font-black ${isResult ? 'text-emerald-500' : 'text-slate-200 filter blur-xl'}`}>
                                            {answers[0]?.text || ''}
                                        </h2>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-8 w-full">
                                        {answers.map((ans, i) => {
                                            const isCorrect = isResult && i === correctIdx;
                                            const isWrong = isResult && i !== correctIdx;
                                            return (
                                                <div key={i} className={`flex items-center p-8 rounded-3xl shadow-xl transition-all duration-500 ${ans.color} ${isWrong ? 'opacity-30 scale-95' : ''} ${isCorrect ? 'scale-105 shadow-[0_0_100px_rgba(255,255,255,0.3)] ring-8 ring-white' : ''}`}>
                                                    <div className="w-24 h-24 bg-black/20 rounded-2xl flex items-center justify-center mr-8 shrink-0">
                                                        <span className="text-6xl text-white font-black">{ans.icon}</span>
                                                    </div>
                                                    <span className="text-5xl font-black text-white break-words leading-tight">{ans.text}</span>
                                                    
                                                    {/* Results Bar Chart Overlay */}
                                                    {isResult && stats && stats.answerCounts[i] !== undefined && (
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.answerCounts[i] / stats.totalAnswered) * 100}%` }} transition={{ duration: 1, delay: 0.5 }}
                                                            className="absolute bottom-0 left-0 h-4 bg-white/60 rounded-b-3xl" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const LeaderboardView = () => (
        <div className="flex-1 bg-slate-900 p-16 flex flex-col items-center h-full">
            <h2 className="text-7xl font-black text-white mb-16 uppercase tracking-widest shadow-black drop-shadow-2xl">Top 5 Leaders</h2>
            <div className="w-full max-w-5xl space-y-8 flex-1">
                <AnimatePresence>
                    {leaderboard.slice(0, 5).map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, type: 'spring' }}
                            className="bg-white rounded-[2rem] p-8 flex items-center shadow-2xl">
                            <div className="w-24 text-5xl font-black text-slate-300">#{p.rank || i + 1}</div>
                            <div className="flex-1 flex items-center gap-8">
                                <div className={`w-24 h-24 rounded-full ${p.color} shadow-inner flex items-center justify-center text-5xl`}>{p.avatar}</div>
                                <span className="text-5xl font-black text-slate-800">{p.name}</span>
                            </div>
                            <div className="text-6xl font-black text-indigo-600 bg-indigo-50 px-8 py-4 rounded-2xl">{p.score}</div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )

    const PodiumView = () => {
        const top3 = leaderboard.slice(0, 3)
        const [first, second, third] = [top3[0], top3[1], top3[2]]
        return (
            <div className="flex-1 bg-indigo-950 flex flex-col items-center justify-end pb-32 relative overflow-hidden">
                <h1 className="absolute top-32 text-8xl font-black text-white uppercase tracking-widest">The Champions</h1>
                <div className="flex items-end justify-center gap-8 h-[600px] w-full max-w-6xl">
                    {second && (
                        <div className="flex flex-col items-center w-1/3">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col items-center mb-8">
                                <span className="text-8xl mb-6">{second.avatar}</span>
                                <span className="text-white font-bold text-5xl mb-2">{second.name}</span>
                                <span className="text-indigo-300 font-black text-3xl">{second.score} pts</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '50%' }} transition={{ duration: 1.5, delay: 1 }} className="w-full max-w-[250px] bg-zinc-300 rounded-t-3xl flex justify-center p-8 h-[300px]"><span className="text-8xl font-black text-zinc-600">2</span></motion.div>
                        </div>
                    )}
                    {first && (
                        <div className="flex flex-col items-center w-1/3 relative z-10">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 2.5 }} className="flex flex-col items-center mb-8">
                                <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity }} className="text-7xl absolute -top-24">👑</motion.span>
                                <span className="text-9xl mb-6">{first.avatar}</span>
                                <span className="text-white font-bold text-6xl mb-2">{first.name}</span>
                                <span className="text-amber-300 font-black text-4xl">{first.score} pts</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '70%' }} transition={{ duration: 1.5, delay: 2.5 }} className="w-full max-w-[300px] bg-amber-400 rounded-t-3xl flex justify-center p-8 h-[450px] shadow-[0_0_100px_rgba(251,191,36,0.5)]"><span className="text-9xl font-black text-amber-700">1</span></motion.div>
                        </div>
                    )}
                    {third && (
                        <div className="flex flex-col items-center w-1/3">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5 }} className="flex flex-col items-center mb-8">
                                <span className="text-7xl mb-6">{third.avatar}</span>
                                <span className="text-white font-bold text-4xl mb-2">{third.name}</span>
                                <span className="text-indigo-300 font-black text-2xl">{third.score} pts</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '35%' }} transition={{ duration: 1.5, delay: 1.5 }} className="w-full max-w-[200px] bg-amber-700 rounded-t-3xl flex justify-center p-8 h-[250px]"><span className="text-8xl font-black text-amber-900">3</span></motion.div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const isGamePlay = ['QUESTION_REVEAL', 'MEDIA_FOCUS', 'THINKING', 'ANSWERING', 'LOCKED', 'RESULTS', 'LIVE_STATS'].includes(gameState)

    return (
        <div className="h-screen w-full bg-slate-900 font-sans overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div key={gameState} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="h-full">
                    {gameState === 'WAITING' && <WaitingView />}
                    {gameState === 'INTRO' && <div className="h-full flex items-center justify-center"><h1 className="text-9xl font-black text-white tracking-widest uppercase animate-pulse">Get Ready!</h1></div>}
                    {isGamePlay && <GameplayView />}
                    {gameState === 'LEADERBOARD' && <LeaderboardView />}
                    {gameState === 'TRANSITION' && <div className="h-full bg-slate-800 flex items-center justify-center p-20 text-center"><h2 className="text-8xl font-black text-white leading-tight">💡 {funFact}</h2></div>}
                    {(gameState === 'FINAL_RESULTS' || gameState === 'END') && <PodiumView />}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
