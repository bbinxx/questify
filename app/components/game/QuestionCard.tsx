'use client'

import { motion } from 'framer-motion'

interface QuestionCardProps {
    text: string
    mediaUrl?: string
    className?: string
}

export default function QuestionCard({ text, mediaUrl, className = '' }: QuestionCardProps) {
    return (
        <motion.div
            layoutId="question-card"
            className={`bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-center text-center md:text-left ${className}`}
        >
            {mediaUrl && (
                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-2 h-48 md:h-64">
                    <img 
                        src={mediaUrl} 
                        alt="Question media" 
                        className="max-h-full max-w-full object-contain rounded-lg shadow-sm" 
                    />
                </div>
            )}
            <div className="flex-1 w-full flex items-center justify-center">
                <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white leading-tight break-words w-full text-center">
                    {text}
                </h2>
            </div>
        </motion.div>
    )
}
