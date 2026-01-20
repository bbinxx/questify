'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const PlusIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
)

const PlayIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const FolderIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
)

const PresentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
            {/* Header */}
            <header className="h-16 bg-white/5 backdrop-blur-sm border-b border-white/10 flex items-center px-6">
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
                    >
                        <span className="text-white font-bold text-xl">Q</span>
                    </motion.div>
                    <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Questify
                    </span>
                </div>
                <div className="flex-1" />
                <nav className="flex items-center gap-4">
                    <Link
                        href="/create"
                        className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors"
                    >
                        Create
                    </Link>
                    <Link
                        href="/present"
                        className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors"
                    >
                        Present
                    </Link>
                    <Link
                        href="/join"
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
                    >
                        Join Game
                    </Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto"
                >
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                        Create Engaging
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Quiz Games</span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-10">
                        Build interactive quiz experiences in minutes. Engage your audience with beautiful, real-time multiplayer games.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/create"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
                            >
                                <PlusIcon />
                                Create Quiz
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/join"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/20 hover:bg-white/20 hover:border-indigo-500/50 transition-all"
                            >
                                <PlayIcon />
                                Join Game
                            </Link>
                        </motion.div>
                    </div>

                    {/* Quick Present Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6"
                    >
                        <Link
                            href="/present"
                            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                            <PresentIcon />
                            <span>Or start presenting →</span>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto w-full"
                >
                    {[
                        {
                            icon: <PlusIcon />,
                            title: 'Easy Creation',
                            description: 'Intuitive interface to create quizzes quickly with customizable questions and answers.',
                            color: 'from-indigo-500 to-purple-500'
                        },
                        {
                            icon: <PlayIcon />,
                            title: 'Live Multiplayer',
                            description: 'Host real-time quiz sessions with participants joining via simple room codes.',
                            color: 'from-purple-500 to-pink-500'
                        },
                        {
                            icon: <FolderIcon />,
                            title: 'Beautiful UI',
                            description: 'Stunning animations, floating avatars, and engaging visual feedback throughout.',
                            color: 'from-pink-500 to-rose-500'
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="font-semibold text-lg text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-400">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-8 mt-16 text-center"
                >
                    <div>
                        <div className="text-3xl font-bold text-white">∞</div>
                        <div className="text-sm text-slate-400">Questions</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">100+</div>
                        <div className="text-sm text-slate-400">Players</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">Real-Time</div>
                        <div className="text-sm text-slate-400">Updates</div>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-white/10 text-center">
                <p className="text-sm text-slate-500">
                    © 2026 Questify • Built with Next.js & Socket.IO
                </p>
            </footer>
        </div>
    )
}
