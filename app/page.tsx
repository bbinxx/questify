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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
            {/* Header - Minimal */}
            <header className="h-16 bg-white/5 backdrop-blur-sm border-b border-white/10 flex items-center px-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">Q</span>
                    </div>
                    <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Questify
                    </span>
                </div>
                <div className="flex-1" />
                {/* Secondary Host Link in Header */}
                <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    <UserIcon />
                    Host Login
                </Link>
            </header>

            {/* Main Content - Centered & Minimal */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-xl mx-auto"
                >
                    <h1 className="text-5xl sm:text-6xl font-bold text-white mb-12 tracking-tight">
                        Ready to play?
                    </h1>

                    <div className="flex flex-col gap-6 w-full max-w-xs mx-auto">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                href="/join"
                                className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl hover:shadow-xl hover:shadow-indigo-500/20 transition-all border border-white/10"
                            >
                                <PlayIcon />
                                {APP_CONFIG.ui.joinText}
                            </Link>
                        </motion.div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink mx-4 text-slate-500 text-sm">Or</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <Link
                            href="/login"
                            className="block text-center text-indigo-300 hover:text-white transition-colors text-sm font-medium"
                        >
                            Log in to create & host quizzes
                        </Link>
                    </div>
                </motion.div>
            </main>

            {/* Footer - Copyright Only */}
            <footer className="py-6 text-center text-xs text-slate-600">
                © 2026 Questify
            </footer>
        </div>
    );
}
