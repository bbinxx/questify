'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface Player {
    id: string
    name: string
    color: string
    x: number
    y: number
    vx: number
    vy: number
}

const colors = [
    'bg-rose-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-indigo-500',
]

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]

export default function WaitingRoom() {
    const [name, setName] = useState('')
    const [joined, setJoined] = useState(false)
    const [players, setPlayers] = useState<Player[]>([])
    const [myId, setMyId] = useState<string>('')
    const containerRef = useRef<HTMLDivElement>(null)
    const socketRef = useRef<Socket | null>(null)
    const animationRef = useRef<number>()
    const roomId = '482519' // Fixed room ID for demo

    // Initialize socket connection
    useEffect(() => {
        socketRef.current = io({
            path: '/socket.io',
        })

        socketRef.current.on('connect', () => {
            console.log('Connected to server')
            if (socketRef.current) {
                setMyId(socketRef.current.id || '')
            }
        })

        socketRef.current.on('players-list', (playersList: Player[]) => {
            setPlayers(playersList)
        })

        socketRef.current.on('player-joined', (player: Player) => {
            setPlayers(prev => [...prev, player])
        })

        socketRef.current.on('player-left', (playerId: string) => {
            setPlayers(prev => prev.filter(p => p.id !== playerId))
        })

        socketRef.current.on('player-moved', ({ id, x, y, vx, vy }: { id: string; x: number; y: number; vx: number; vy: number }) => {
            setPlayers(prev => prev.map(p =>
                p.id === id ? { ...p, x, y, vx, vy } : p
            ))
        })

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-room', roomId)
                socketRef.current.disconnect()
            }
        }
    }, [])

    const handleJoin = () => {
        if (name.trim() && socketRef.current) {
            const color = getRandomColor()
            socketRef.current.emit('join-room', {
                roomId,
                name: name.trim(),
                color
            })
            setJoined(true)
        }
    }

    // Animation loop for own player only
    const updateMyPosition = useCallback(() => {
        if (!joined || !containerRef.current || !socketRef.current) return

        setPlayers(prevPlayers => {
            const myPlayer = prevPlayers.find(p => p.id === myId)
            if (!myPlayer) return prevPlayers

            const container = containerRef.current
            if (!container) return prevPlayers

            let { x, y, vx, vy } = myPlayer
            const size = 80

            // Update position
            x += vx
            y += vy

            // Bounce off walls
            if (x <= 0 || x >= container.clientWidth - size) {
                vx = -vx * 0.95
                x = Math.max(0, Math.min(x, container.clientWidth - size))
            }
            if (y <= 0 || y >= container.clientHeight - size) {
                vy = -vy * 0.95
                y = Math.max(0, Math.min(y, container.clientHeight - size))
            }

            // Add slight random movement
            vx += (Math.random() - 0.5) * 0.15
            vy += (Math.random() - 0.5) * 0.15

            // Limit velocity
            const maxSpeed = 2.5
            vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx))
            vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy))

            // Send position to server
            socketRef.current?.emit('update-position', {
                roomId,
                x, y, vx, vy
            })

            return prevPlayers.map(p =>
                p.id === myId ? { ...p, x, y, vx, vy } : p
            )
        })
    }, [joined, myId])

    useEffect(() => {
        if (!joined) return

        const animate = () => {
            updateMyPosition()
            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [joined, updateMyPosition])

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-slate-900">
            {/* Header */}
            <header className="h-16 flex-shrink-0 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg sm:text-xl">Q</span>
                    </div>
                    <span className="font-bold text-lg sm:text-xl text-white">Questify</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-xs sm:text-sm text-slate-400">
                        <span className="text-white font-semibold">{players.length}</span> players
                    </div>
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-700 rounded-lg">
                        <span className="text-slate-400 text-xs sm:text-sm">PIN: </span>
                        <span className="text-white font-bold text-sm sm:text-lg tracking-widest">{roomId}</span>
                    </div>
                </div>
            </header>

            {/* Main Area */}
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden"
            >
                {/* Floating Player Circles */}
                {players.map(player => (
                    <div
                        key={player.id}
                        className={`absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full ${player.color} flex items-center justify-center shadow-lg ${player.id === myId ? 'ring-4 ring-white/50' : ''}`}
                        style={{
                            left: player.x,
                            top: player.y,
                            transition: player.id === myId ? 'none' : 'left 0.1s linear, top 0.1s linear',
                        }}
                    >
                        <span className="text-white font-bold text-xs sm:text-sm text-center px-1 truncate max-w-[55px] sm:max-w-[70px]">
                            {player.name}
                        </span>
                    </div>
                ))}

                {/* Join Modal */}
                {!joined && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
                        <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-md border border-slate-700 shadow-2xl">
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white font-bold text-2xl sm:text-3xl">Q</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Join the Game</h2>
                                <p className="text-sm sm:text-base text-slate-400">Enter your nickname to join</p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Your nickname..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                    maxLength={12}
                                    className="w-full px-4 py-3 sm:py-4 rounded-xl bg-slate-700 border border-slate-600 text-white text-base sm:text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center font-semibold"
                                    autoFocus
                                />
                                <button
                                    onClick={handleJoin}
                                    disabled={!name.trim()}
                                    className="w-full py-3 sm:py-4 bg-primary-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Join Game
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Waiting Message */}
                {joined && (
                    <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2">
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-full px-4 sm:px-8 py-3 sm:py-4 border border-slate-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-white font-medium text-xs sm:text-base">Waiting for host to start</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
