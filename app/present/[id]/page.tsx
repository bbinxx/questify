'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionCard from '../../components/game/QuestionCard'
import AnswerGrid from '../../components/game/AnswerGrid'
import confetti from 'canvas-confetti'
import { getQuiz } from '../../actions/quiz'
import { useGameAudio } from '../../hooks/useGameAudio'

interface Player { id: string; name: string; color: string; avatar: string; score: number; lastPoints: number; x: number; y: number; vx: number; vy: number; size?: number; rank?: number }
interface Answer { text: string; color: string; icon: string; correct?: boolean }
type GameState = 'WAITING' | 'INTRO' | 'QUESTION_REVEAL' | 'MEDIA_FOCUS' | 'THINKING' | 'ANSWERING' | 'LOCKED' | 'RESULTS' | 'LIVE_STATS' | 'LEADERBOARD' | 'TRANSITION' | 'FINAL_RESULTS' | 'END'

export default function PresenterView() {
    const params = useParams()
    const quizId = params.id as string

    // Connection & Setup
    const [socket, setSocket] = useState<Socket | null>(null)
    const [roomCode, setRoomCode] = useState('')
    const [joinUrl, setJoinUrl] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    const audio = useGameAudio()

    // Lobby
    const [quizTitle, setQuizTitle] = useState('')
    const [players, setPlayers] = useState<Player[]>([])
    const containerRef = useRef<HTMLDivElement>(null)
    const animRef = useRef<number>()

    // Game Loop
    const [gameState, setGameState] = useState<GameState>('WAITING')
    const [questions, setQuestions] = useState<any[]>([])
    const [totalQ, setTotalQ] = useState(0)
    
    // Per-Question
    const [qNum, setQNum] = useState(0)
    const [qText, setQText] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [answers, setAnswers] = useState<Answer[]>([])
    const [timeLeft, setTimeLeft] = useState(0)
    const [correctIdx, setCorrectIdx] = useState(-1)
    const [questionType, setQuestionType] = useState<string>('MULTIPLE_CHOICE')
    const [stats, setStats] = useState<any>(null)
    const [leaderboard, setLeaderboard] = useState<Player[]>([])
    const [funFact, setFunFact] = useState('')

    // Live counts
    const [answeredCount, setAnsweredCount] = useState(0)
    const [totalActiveCount, setTotalActiveCount] = useState(0)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setJoinUrl(window.location.origin + '/join')
        }
        async function loadQuiz() {
            const res = await getQuiz(quizId)
            if (res.success && res.quiz) {
                setQuizTitle(res.quiz.title)
                setTotalQ(res.quiz.questions.length)
                const formatted = res.quiz.questions.map((q: any) => {
                    let parsedAnswers = [];
                    try {
                        parsedAnswers = typeof q.options === 'string' ? JSON.parse(q.options) : (q.answers || q.options || []);
                    } catch (e) { parsedAnswers = [] }
                    
                    return {
                        question: q.text,
                        time: parseInt(q.timeLimit) || 20,
                        thinkTime: 5,
                        mediaUrl: q.mediaUrl,
                        type: q.type || 'MULTIPLE_CHOICE',
                        correctIndex: parseInt(q.correct) || 0,
                        answers: parsedAnswers.map((text: string, i: number) => ({
                            text,
                            color: ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'][i % 4],
                            icon: ['△', '◇', '○', '□'][i % 4],
                            correct: i === (parseInt(q.correct) || 0)
                        }))
                    }
                })
                setQuestions(formatted)
                
                const pin = Math.random().toString(36).substring(2, 6).toUpperCase()
                setRoomCode(pin)
                setIsLoading(false)
            }
        }
        loadQuiz()
    }, [quizId])

    useEffect(() => {
        if (!roomCode || !questions.length) return

        const s = io()
        setSocket(s)
        s.emit('host-room', { roomCode, questions })

        s.on('players-list', (pList) => setPlayers(pList))
        s.on('player-joined', (p) => {
            setPlayers(prev => [...prev, p])
            audio.playJoin()
        })
        s.on('player-left', (id) => setPlayers(prev => prev.filter(p => p.id !== id)))
        
        s.on('response-count', ({ answered, total }) => {
            setAnsweredCount(answered)
            setTotalActiveCount(total)
        })

        s.on('game-state', (data) => {
            setGameState(data.state as GameState)
            if (data.quizTitle) setQuizTitle(data.quizTitle)
            if (data.totalQ) setTotalQ(data.totalQ)
            if (data.qIndex) setQNum(data.qIndex)
            if (data.questionText) setQText(data.questionText)
            if (data.mediaUrl !== undefined) setMediaUrl(data.mediaUrl)
            if (data.answers) setAnswers(data.answers)
            if (data.questionType) setQuestionType(data.questionType)
            if (data.duration) setTimeLeft(data.duration)
            if (data.correctIndex !== undefined) setCorrectIdx(data.correctIndex)
            if (data.stats) setStats(data.stats)
            if (data.leaderboard) setLeaderboard(data.leaderboard)
            if (data.funFact) setFunFact(data.funFact)
            
            if (data.state === 'QUESTION_REVEAL') {
                setAnsweredCount(0)
                setTotalActiveCount(players.length)
                setCorrectIdx(-1)
                setStats(null)
            }
            if (data.state === 'THINKING') audio.playTension()
            if (data.state === 'LOCKED') audio.playLock()
            if (data.state === 'RESULTS') audio.playReveal()
            
            if (data.state === 'FINAL_RESULTS') {
                triggerFinaleConfetti()
                audio.playLevelUp()
                
                // Save session analytics
                if (data.sessionStats) {
                    fetch('/api/sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            gameId: quizId,
                            roomCode: roomCode,
                            startedAt: data.sessionStats.startedAt,
                            endedAt: data.sessionStats.endedAt,
                            players: data.leaderboard,
                            stats: data.sessionStats
                        })
                    }).catch(console.error)
                }
            }
        })
        return () => { s.disconnect() }
    }, [roomCode, questions, players.length])

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

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'Space') handleNext()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    })

    // Floating Avatars in WAITING
    useEffect(() => {
        const loop = () => {
            if (gameState !== 'WAITING') return
            const cont = containerRef.current
            if (!cont) { animRef.current = requestAnimationFrame(loop); return }
            setPlayers(prev => prev.map(p => {
                let { x, y, vx, vy, size = 80 } = p
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

    function triggerFinaleConfetti() {
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const colors = ['#4f46e5', '#ec4899', '#f59e0b', '#ffffff'];

        (function frame() {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors })
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors })
            if (Date.now() < animationEnd) requestAnimationFrame(frame)
        }())
    }

    const handleNext = () => {
        if (!socket || !roomCode) return
        if (gameState === 'WAITING') socket.emit('start-game', roomCode)
        else socket.emit('host-advance', roomCode)
    }

    if (isLoading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>

    // ── VIEW COMPONENTS ──

    const WaitingView = () => (
        <div ref={containerRef} className="flex-1 relative bg-slate-900 overflow-hidden">
            {players.map(p => (
                <div key={p.id} style={{ transform: `translate(${p.x}px, ${p.y}px)`, width: p.size, height: p.size }}
                    className={`absolute rounded-full ${p.color} flex flex-col items-center justify-center shadow-lg border-4 border-white/20`}
                >
                    <span style={{ fontSize: `${(p.size || 80) * 0.4}px` }}>{p.avatar}</span>
                    <span className="text-white font-bold bg-black/50 px-2 rounded text-xs truncate max-w-[80%] absolute -bottom-6">{p.name}</span>
                </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 md:p-8">
                <div className="text-center w-full max-w-2xl bg-white/5 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 opacity-80">{quizTitle}</h1>
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center mb-8 md:mb-10 w-full">
                        {joinUrl && (
                            <div className="bg-white p-3 md:p-4 rounded-xl shadow-lg shrink-0 pointer-events-auto border-4 border-indigo-500/30">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`} alt="QR" className="w-32 h-32 md:w-44 md:h-44" />
                            </div>
                        )}
                        <div className="text-center md:text-left">
                            <h2 className="text-lg md:text-xl text-slate-300 mb-2 font-semibold uppercase">Join at</h2>
                            <div className="bg-black/40 px-6 py-4 rounded-xl border border-white/10">
                                <p className="text-xl md:text-3xl font-black text-white font-mono break-all">{joinUrl || 'questify.app'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white text-slate-900 inline-block px-12 py-6 rounded-2xl w-full shadow-inner transform hover:scale-[1.02] transition-transform">
                        <span className="text-xl font-bold uppercase block text-slate-500 mb-2">Game PIN</span>
                        <span className="text-7xl md:text-8xl font-black tracking-widest text-indigo-600">{roomCode}</span>
                    </div>
                </div>
            </div>
        </div>
    )

    const IntroView = () => (
        <div className="flex-1 bg-indigo-900 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10">
                <h2 className="text-2xl text-indigo-300 font-bold tracking-widest uppercase mb-4">Get Ready</h2>
                <h1 className="text-6xl md:text-8xl font-black text-white mb-8">{quizTitle}</h1>
                <div className="flex items-center justify-center gap-8 text-2xl font-bold text-white/80">
                    <span>{totalQ} Questions</span>
                    <span>•</span>
                    <span>{players.length} Players</span>
                </div>
            </motion.div>
        </div>
    )

    const TransitionView = () => (
        <div className="flex-1 bg-slate-800 flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-2xl text-slate-400 font-bold uppercase mb-8">Up Next: Question {qNum}</h2>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-md">
                <span className="text-4xl block mb-4">💡</span>
                <h3 className="text-xl text-slate-300 uppercase font-bold mb-2">Fun Fact</h3>
                <p className="text-3xl font-black text-white leading-tight">{funFact}</p>
            </motion.div>
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
        const dimAnswers = isLocked || isResult
        const showTimer = isThinking || isAnswering

        return (
            <div className="flex-1 bg-slate-900 p-4 md:p-8 flex flex-col relative h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 md:mb-8 h-16 md:h-20 shrink-0">
                    <span className="text-white/50 font-bold text-xl uppercase tracking-wider">{qNum} of {totalQ}</span>
                    
                    {isAnswering && (
                        <div className="flex items-center gap-4">
                            <span className="text-white/60 font-bold text-xl">{answeredCount} / {totalActiveCount} Answers</span>
                        </div>
                    )}
                    
                    <div className="w-20 h-20 flex items-center justify-center">
                        {showTimer && (
                            <motion.div key={gameState} initial={{ scale: 0.5 }} animate={{ scale: 1 }} 
                                className={`w-full h-full rounded-full flex items-center justify-center font-black text-white text-3xl border-4 tabular-nums shadow-lg ${isThinking ? 'bg-slate-700 border-slate-500' : 'bg-indigo-600 border-indigo-400 shadow-indigo-500/20'}`}>
                                {timeLeft}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Main Area */}
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                    {/* Media Focus Overlay */}
                    <AnimatePresence>
                        {isMedia && mediaUrl && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                                className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8">
                                <img src={mediaUrl} className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain mb-8" />
                                <h2 className="text-4xl font-black text-white text-center">{qText}</h2>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Standard Question Card */}
                    <div className="flex-shrink-0">
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' }}>
                            <QuestionCard text={qText} mediaUrl={mediaUrl} className="flex-grow-0" />
                        </motion.div>
                    </div>

                    {/* Answers Area */}
                    <div className="flex-grow-[2] relative min-h-0">
                        {(isReveal || isThinking) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <h3 className="text-3xl font-black text-slate-500 tracking-widest uppercase animate-pulse">
                                    {isReveal ? 'Get Ready...' : 'Think Carefully...'}
                                </h3>
                            </div>
                        )}
                        
                        {showAnswers && (
                            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className={`h-full flex items-center justify-center ${dimAnswers ? 'filter grayscale-[50%]' : ''}`}>
                                {questionType === 'TYPE_ANSWER' ? (
                                    <div className="bg-slate-800 border-4 border-indigo-500 rounded-3xl p-12 w-full max-w-4xl text-center shadow-2xl">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-4">Correct Answer</p>
                                        <h2 className={`text-6xl font-black ${isResult ? 'text-emerald-400' : 'text-slate-700 filter blur-md'}`}>
                                            {answers[0]?.text || ''}
                                        </h2>
                                    </div>
                                ) : (
                                    <div className="w-full h-full">
                                        <AnswerGrid answers={answers} revealed={isResult} correctIndex={correctIdx} disabled={true} />
                                    </div>
                                )}
                            </motion.div>
                        )}
                        
                        {/* Live Stats Overlay */}
                        <AnimatePresence>
                            {gameState === 'LIVE_STATS' && stats && (
                                <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(8px)" }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-20 bg-slate-900/60 rounded-3xl flex flex-col p-8 items-center justify-center text-white">
                                    <h3 className="text-3xl font-black mb-8 uppercase text-indigo-300">Live Insights</h3>
                                    <div className="flex w-full max-w-4xl gap-8">
                                        {/* Accuracy Gauge */}
                                        <div className="bg-white/10 p-6 rounded-2xl flex-1 flex flex-col items-center justify-center">
                                            <span className="text-slate-400 font-bold uppercase text-sm mb-2">Accuracy</span>
                                            <span className="text-5xl font-black text-green-400">{stats.totalAnswered ? Math.round((stats.correctCount / stats.totalAnswered) * 100) : 0}%</span>
                                        </div>
                                        {/* Speed Gauge */}
                                        <div className="bg-white/10 p-6 rounded-2xl flex-1 flex flex-col items-center justify-center">
                                            <span className="text-slate-400 font-bold uppercase text-sm mb-2">Avg Speed</span>
                                            <span className="text-5xl font-black text-amber-400">{(stats.avgResponseTime / 1000).toFixed(1)}s</span>
                                        </div>
                                    </div>
                                    {/* Mini Bar Chart */}
                                    <div className="w-full max-w-4xl mt-8 flex gap-4 h-32 items-end">
                                        {answers.map((_, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-full bg-indigo-500 rounded-t-md transition-all duration-1000" style={{ height: `${stats.answerCounts[i] ? (stats.answerCounts[i] / stats.totalAnswered) * 100 : 0}%`, minHeight: '4px' }} />
                                                <span className="font-bold text-slate-300">{stats.answerCounts[i] || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        )
    }

    const LeaderboardView = () => (
        <div className="flex-1 bg-slate-900 p-4 md:p-10 flex flex-col items-center h-full overflow-hidden">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Scoreboard</h2>
            <div className="w-full max-w-4xl space-y-4 flex-1 min-h-0 overflow-y-auto pb-10">
                <AnimatePresence>
                    {leaderboard.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-4 flex items-center shadow-xl">
                            <div className="w-16 text-3xl font-black text-slate-300">#{p.rank || i + 1}</div>
                            <div className="flex-1 flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-full ${p.color} shadow-inner flex items-center justify-center text-3xl`}>{p.avatar}</div>
                                <span className="text-3xl font-bold text-slate-800">{p.name}</span>
                            </div>
                            <div className="text-4xl font-black text-indigo-600">{p.score}</div>
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
            <div className="flex-1 bg-indigo-950 flex flex-col items-center justify-end pb-20 relative overflow-hidden">
                <h1 className="absolute top-20 text-6xl font-black text-white">The Champions</h1>
                <div className="flex items-end justify-center gap-4 h-[400px] w-full max-w-4xl">
                    {second && (
                        <div className="flex flex-col items-center w-1/3">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center mb-4">
                                <span className="text-6xl mb-2">{second.avatar}</span>
                                <span className="text-white font-bold text-2xl">{second.name}</span>
                                <span className="text-indigo-300 font-bold">{second.score}</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '50%' }} transition={{ duration: 1, delay: 0.5 }} className="w-full max-w-[160px] bg-zinc-300 rounded-t-lg flex justify-center p-4 h-[250px]"><span className="text-6xl font-black text-zinc-600">2</span></motion.div>
                        </div>
                    )}
                    {first && (
                        <div className="flex flex-col items-center w-1/3 relative z-10">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5 }} className="flex flex-col items-center mb-4">
                                <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity }} className="text-4xl absolute -top-12">👑</motion.span>
                                <span className="text-7xl mb-2">{first.avatar}</span>
                                <span className="text-white font-bold text-3xl">{first.name}</span>
                                <span className="text-amber-300 font-bold text-xl">{first.score}</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '70%' }} transition={{ duration: 1, delay: 1.5 }} className="w-full max-w-[180px] bg-amber-400 rounded-t-lg flex justify-center p-4 h-[350px] shadow-[0_0_50px_rgba(251,191,36,0.5)]"><span className="text-8xl font-black text-amber-700">1</span></motion.div>
                        </div>
                    )}
                    {third && (
                        <div className="flex flex-col items-center w-1/3">
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.0 }} className="flex flex-col items-center mb-4">
                                <span className="text-5xl mb-2">{third.avatar}</span>
                                <span className="text-white font-bold text-xl">{third.name}</span>
                                <span className="text-indigo-300 font-bold">{third.score}</span>
                            </motion.div>
                            <motion.div initial={{ height: 0 }} animate={{ height: '35%' }} transition={{ duration: 1, delay: 1.0 }} className="w-full max-w-[140px] bg-amber-700 rounded-t-lg flex justify-center p-4 h-[200px]"><span className="text-5xl font-black text-amber-900">3</span></motion.div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const isGamePlay = ['QUESTION_REVEAL', 'MEDIA_FOCUS', 'THINKING', 'ANSWERING', 'LOCKED', 'RESULTS', 'LIVE_STATS'].includes(gameState)

    return (
        <div className="h-screen flex flex-col font-sans overflow-hidden bg-slate-900">
            {gameState === 'WAITING' && <WaitingView />}
            {gameState === 'INTRO' && <IntroView />}
            {isGamePlay && <GameplayView />}
            {gameState === 'LEADERBOARD' && <LeaderboardView />}
            {gameState === 'TRANSITION' && <TransitionView />}
            {(gameState === 'FINAL_RESULTS' || gameState === 'END') && <PodiumView />}

            {/* Global Bottom Control Bar */}
            {gameState !== 'FINAL_RESULTS' && gameState !== 'END' && (
                <div className="bg-white border-t border-slate-200 flex items-center justify-between px-10 h-24 z-50 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="bg-slate-100 px-6 py-3 rounded-xl font-bold text-slate-600 text-lg">{players.filter(p => p.connected !== false).length} Players</div>
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">{gameState}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        {gameState !== 'WAITING' && (
                            <button onClick={() => socket?.emit('end-game', roomCode)} className="text-red-500 hover:bg-red-50 px-6 py-4 rounded-xl font-bold text-lg transition-colors">
                                End Game
                            </button>
                        )}
                        <button onClick={handleNext} className="bg-black hover:bg-slate-800 text-white px-12 py-5 rounded-xl font-bold text-xl shadow-xl flex items-center gap-3 transition-transform active:scale-95">
                            {gameState === 'WAITING' ? 'Start Game' : 'Skip Next ⏭'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
