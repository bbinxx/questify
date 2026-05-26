'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import AnswerGrid from '../components/game/AnswerGrid'
import { useGameAudio } from '../hooks/useGameAudio'

const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500']
const avatars = ['🦁', '🦊', '🐼', '🐨', '🐯', '🐙', '🦄', '🐲']

type GameState = 'WAITING' | 'INTRO' | 'QUESTION_REVEAL' | 'MEDIA_FOCUS' | 'THINKING' | 'ANSWERING' | 'LOCKED' | 'RESULTS' | 'LIVE_STATS' | 'LEADERBOARD' | 'TRANSITION' | 'FINAL_RESULTS' | 'END'

export default function JoinRoom() {
    const [step, setStep] = useState<'code' | 'name' | 'game'>('code')
    const [gameState, setGameState] = useState<GameState>('WAITING')
    const [roomCode, setRoomCode] = useState('')
    const [name, setName] = useState('')
    const [myAvatar, setMyAvatar] = useState(avatars[0])
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState('')

    const audio = useGameAudio()

    const myColor = useMemo(() => colors[Math.floor(Math.random() * colors.length)], [])

    // Game data
    const [questionType, setQuestionType] = useState<string>('MULTIPLE_CHOICE')
    const [answers, setAnswers] = useState<any[]>([])
    const [typedAnswer, setTypedAnswer] = useState('')
    const [score, setScore] = useState(0)
    const [hasAnswered, setHasAnswered] = useState(false)
    const [answeredIndex, setAnsweredIndex] = useState(-1)
    const [resultFeedback, setResultFeedback] = useState<{ correct: boolean; points: number; score: number; streak: number } | null>(null)
    
    // Fun facts for transitions
    const [funFact, setFunFact] = useState('')

    useEffect(() => {
        const s = io({ reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 5 })
        setSocket(s)

        s.on('connect', () => { setError('') })
        s.on('disconnect', () => console.log('❌ Disconnected'))
        s.on('connect_error', () => setError('Connection error. Retrying...'))

        s.on('room-joined', (data) => {
            setStep('game')
            setGameState('WAITING')
            setError('')
            setIsJoining(false)
            audio.playJoin()
        })

        s.on('game-state', (data) => {
            setGameState(data.state as GameState)

            if (['QUESTION_REVEAL', 'THINKING'].includes(data.state)) {
                setHasAnswered(false)
                setAnsweredIndex(-1)
                setResultFeedback(null)
                setAnswers([])
                setTypedAnswer('')
                if (data.questionType) setQuestionType(data.questionType)
            }

            if (data.state === 'ANSWERING') {
                if (data.answers) setAnswers(data.answers)
                if (data.questionType) setQuestionType(data.questionType)
            }
            
            if (data.state === 'TRANSITION' && data.funFact) {
                setFunFact(data.funFact)
            }

            if (data.score !== undefined) setScore(data.score)
        })

        s.on('answer-received', () => setHasAnswered(true))

        s.on('round-feedback', (data) => {
            setResultFeedback(data)
            setScore(data.score)
            if (data.correct) {
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#10b981', '#fbbf24'] })
                audio.playReveal()
            } else {
                audio.playWrong()
            }
        })

        return () => { s.disconnect() }
    }, [])

    const handleNextStep = useCallback(() => {
        if (roomCode.trim().length < 4) return setError('Please enter a valid PIN')
        setError('')
        setStep('name')
    }, [roomCode])

    const joinGame = useCallback(() => {
        const trimmedName = name.trim()
        const trimmedCode = roomCode.trim()

        if (!trimmedCode || trimmedCode.length < 4) return setError('Invalid room code')
        if (!trimmedName) return setError('Please enter a name')
        if (!socket || !socket.connected) return setError('Not connected. Retrying...')

        setError('')
        setIsJoining(true)

        socket.emit('join-room', { roomId: trimmedCode, name: trimmedName, color: myColor, avatar: myAvatar })
        setTimeout(() => { if (step === 'name') { setIsJoining(false); setError('Failed to join.') } }, 5000)
    }, [name, roomCode, myColor, myAvatar, socket, step])

    const submitAnswer = useCallback((idx: number | string) => {
        if (!hasAnswered && gameState === 'ANSWERING' && socket) {
            setHasAnswered(true)
            audio.playLock()
            if (typeof idx === 'number') setAnsweredIndex(idx)
            socket.emit('submit-answer', { roomId: roomCode, answerIndex: idx })
        }
    }, [hasAnswered, gameState, socket, roomCode, audio])

    const renderGameScreen = () => {
        switch (gameState) {
            case 'WAITING':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                            className={`w-40 h-40 rounded-full ${myColor} flex items-center justify-center mb-8 shadow-2xl ring-8 ring-slate-800 text-7xl`}>
                            {myAvatar}
                        </motion.div>
                        <h2 className="text-4xl font-black text-white mb-4">You're in!</h2>
                        <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">See your nickname on screen</p>
                    </div>
                )
            case 'INTRO':
                return (
                    <div className="flex items-center justify-center h-full">
                        <motion.h1 initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-5xl font-black text-white text-center">Get Ready...</motion.h1>
                    </div>
                )
            case 'QUESTION_REVEAL':
            case 'MEDIA_FOCUS':
            case 'THINKING':
                return (
                    <div className="flex items-center justify-center h-full bg-indigo-900">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                            <span className="text-8xl block mb-6 animate-pulse">🤔</span>
                            <h2 className="text-4xl font-black text-white uppercase tracking-widest">Look Up!</h2>
                        </motion.div>
                    </div>
                )
            case 'ANSWERING':
            case 'LOCKED':
                return (
                    <div className="flex flex-col h-full bg-slate-900 p-2 pb-6">
                        <div className="flex justify-between items-center p-4">
                            <div className="text-white font-black bg-slate-800 px-6 py-2 rounded-xl text-xl">{score} pts</div>
                            {hasAnswered && <span className="text-indigo-400 font-bold uppercase">Answer Sent</span>}
                        </div>
                        <div className="flex-1">
                            {hasAnswered || gameState === 'LOCKED' ? (
                                <div className="h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-2xl mx-2 border-2 border-slate-700">
                                    <span className="text-7xl block mb-4">{hasAnswered ? '🔒' : '⏳'}</span>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-widest">{hasAnswered ? 'Answer Locked' : 'Time Up!'}</h2>
                                </div>
                            ) : questionType === 'TYPE_ANSWER' ? (
                                <div className="h-full flex flex-col items-center justify-center bg-slate-800 rounded-2xl mx-2 p-6">
                                    <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest">Type your answer</h3>
                                    <input 
                                        type="text" 
                                        className="w-full text-center text-3xl font-black p-6 rounded-2xl bg-white text-slate-900 border-4 border-indigo-500 outline-none mb-6 focus:scale-105 transition-transform"
                                        placeholder="Answer..."
                                        value={typedAnswer}
                                        onChange={(e) => setTypedAnswer(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && typedAnswer.trim() && submitAnswer(typedAnswer.trim())}
                                    />
                                    <button 
                                        onClick={() => typedAnswer.trim() && submitAnswer(typedAnswer.trim())}
                                        disabled={!typedAnswer.trim()}
                                        className="w-full bg-indigo-600 disabled:bg-slate-700 py-6 rounded-2xl font-black text-white text-2xl"
                                    >
                                        Submit
                                    </button>
                                </div>
                            ) : (
                                <AnswerGrid answers={answers} showText={false} disabled={hasAnswered} onAnswerClick={submitAnswer} />
                            )}
                        </div>
                    </div>
                )
            case 'RESULTS':
            case 'LIVE_STATS':
                return (
                    <div className={`flex flex-col items-center justify-center h-full transition-colors duration-500 ${resultFeedback?.correct ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} type="spring" className="text-center">
                            <span className="text-9xl block mb-6">{resultFeedback?.correct ? '✓' : '✗'}</span>
                            <h2 className="text-6xl font-black text-white mb-2">{resultFeedback?.correct ? 'Correct!' : 'Incorrect'}</h2>
                            {resultFeedback?.correct && <p className="text-3xl font-bold text-emerald-200">+{resultFeedback.points}</p>}
                        </motion.div>
                        <div className="absolute top-6 right-6 bg-black/30 px-6 py-2 rounded-xl text-white font-bold text-xl">{score} pts</div>
                    </div>
                )
            case 'LEADERBOARD':
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-indigo-900 text-center p-8">
                        <h2 className="text-4xl font-black text-indigo-300 mb-8 uppercase">Check the screen!</h2>
                        <div className="bg-indigo-950 p-10 rounded-3xl w-full border-4 border-indigo-800 shadow-2xl">
                            <p className="text-indigo-400 font-bold uppercase mb-2">Your Score</p>
                            <p className="text-7xl font-black text-white">{score}</p>
                        </div>
                    </div>
                )
            case 'TRANSITION':
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-800 text-center p-8">
                        <span className="text-6xl block mb-6">💡</span>
                        <h2 className="text-2xl font-bold text-slate-400 uppercase mb-4">Did you know?</h2>
                        <p className="text-2xl font-black text-white leading-tight">{funFact}</p>
                    </div>
                )
            case 'FINAL_RESULTS':
            case 'END':
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-indigo-950 text-center">
                        <span className="text-8xl block mb-6">🏁</span>
                        <h1 className="text-5xl font-black text-white mb-2">Game Over!</h1>
                        <p className="text-2xl text-indigo-300 mb-10 font-bold">Look at the screen for winners.</p>
                        <div className="bg-white/10 p-8 rounded-3xl">
                            <p className="text-lg text-white/60 uppercase font-bold mb-2">Final Score</p>
                            <p className="text-6xl font-black text-amber-400">{score}</p>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    if (step !== 'game') return (
        <div className="h-screen bg-slate-900 flex flex-col p-6 items-center justify-center">
            <div className="w-full max-w-sm space-y-6">
                <h1 className="text-4xl font-black text-white text-center">
                    {step === 'code' ? 'Join Game' : 'Create Profile'}
                </h1>
                {step === 'code' ? (
                    <input type="text" placeholder="Enter PIN" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} onKeyPress={e => e.key === 'Enter' && handleNextStep()} maxLength={6}
                        className="w-full bg-slate-800 text-white text-4xl font-bold text-center py-6 rounded-2xl border-4 border-slate-700 outline-none focus:border-indigo-500" />
                ) : (
                    <div className="space-y-6">
                        <input type="text" placeholder="Enter Nickname" value={name} onChange={e => setName(e.target.value)} onKeyPress={e => e.key === 'Enter' && joinGame()} maxLength={20}
                            className="w-full bg-slate-800 text-white text-2xl font-bold text-center py-6 rounded-2xl border-4 border-slate-700 outline-none focus:border-indigo-500" />
                        <div className="grid grid-cols-4 gap-4">
                            {avatars.map(av => (
                                <button key={av} onClick={() => setMyAvatar(av)} className={`text-4xl p-4 rounded-2xl transition-all ${myAvatar === av ? 'bg-indigo-600 scale-110 shadow-lg' : 'bg-slate-800'}`}>{av}</button>
                            ))}
                        </div>
                    </div>
                )}
                <button onClick={step === 'code' ? handleNextStep : joinGame} disabled={isJoining || (step === 'code' ? roomCode.trim().length < 4 : name.trim().length < 1)}
                    className="w-full bg-indigo-600 disabled:bg-slate-700 text-white py-6 rounded-2xl font-black text-2xl shadow-xl mt-6 active:scale-95">
                    {isJoining ? 'Joining...' : (step === 'code' ? "Next" : "Ready!")}
                </button>
                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-center font-bold text-lg">{error}</motion.p>}
            </div>
        </div>
    )

    return (
        <div className="h-[100dvh] w-full bg-slate-900 font-sans overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div key={gameState} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="h-full">
                    {renderGameScreen()}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
