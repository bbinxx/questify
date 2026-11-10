'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { APP_CONFIG } from './config/app';

const PlayIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export default function Home() {
    return (
        <div className="min-h-screen bg-[#0B0F19] overflow-hidden flex flex-col relative font-sans text-slate-200">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,#0B0F19_80%)] pointer-events-none z-0" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

            {/* Header */}
            <header className="h-24 relative z-10 flex items-center px-8 md:px-16 justify-between">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                        <span className="text-white font-black text-2xl">Q</span>
                    </div>
                    <span className="font-black text-3xl tracking-tight text-white">
                        Questify
                    </span>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Link
                        href="/login"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold transition-all hover:scale-105"
                    >
                        <UserIcon />
                        Host Login
                    </Link>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center max-w-4xl mx-auto w-full"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-black text-sm tracking-widest uppercase"
                    >
                        The Ultimate Live Event Engine
                    </motion.div>

                    <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none drop-shadow-2xl">
                        Engage Your <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Audience Instantly
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
                        Bring your audience together with real-time quizzes. No apps to download, just pure rhythmic engagement.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-md mx-auto">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                            <Link
                                href="/join"
                                className="flex items-center justify-center gap-3 w-full px-8 py-6 bg-white text-indigo-950 rounded-2xl font-black text-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all"
                            >
                                <PlayIcon />
                                PLAY NOW
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="py-8 relative z-10 text-center text-sm font-bold text-slate-600 tracking-widest uppercase">
                © {new Date().getFullYear()} Questify Live
            </footer>
        </div>
    );
}
