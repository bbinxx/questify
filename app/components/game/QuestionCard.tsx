'use client'

import { motion } from 'framer-motion'

interface QuestionCardProps {
    text: string
    className?: string
}

export default function QuestionCard({ text, className = '' }: QuestionCardProps) {
    return (
        <motion.div
            layoutId="question-card"
            className={`bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-10 shadow-xl flex items-center justify-center text-center ${className}`}
        >
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight break-words w-full">
                {text}
            </h2>
        </motion.div>
    )
}
