'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Answer {
    text: string
    color: string
    icon: string
}

interface AnswerGridProps {
    answers: Answer[]
    showText?: boolean
    disabled?: boolean
    onAnswerClick?: (index: number) => void
    revealed?: boolean
    correctIndex?: number
    selectedIndex?: number
}

export default function AnswerGrid({
    answers,
    showText = true,
    disabled = false,
    onAnswerClick,
    revealed = false,
    correctIndex = -1,
    selectedIndex = -1
}: AnswerGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 w-full h-full">
            <AnimatePresence>
                {answers.map((ans, i) => {
                    const isCorrect = i === correctIndex
                    const isSelected = i === selectedIndex

                    // Visual State Logic
                    let opacity = 1
                    let scale = 1
                    let grayscale = 0

                    if (revealed) {
                        if (isCorrect) {
                            opacity = 1
                            scale = 1.05
                        } else {
                            opacity = 0.3
                            scale = 0.95
                            grayscale = 1
                        }
                    } else if (selectedIndex !== -1 && !isSelected) {
                        // If user selected something else (for participant view)
                        opacity = 0.5
                    }

                    return (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                                opacity,
                                scale,
                                filter: `grayscale(${grayscale})`
                            }}
                            whileTap={!disabled && !revealed ? { scale: 0.98 } : {}}
                            onClick={() => !disabled && onAnswerClick && onAnswerClick(i)}
                            disabled={disabled}
                            className={`
                                ${ans.color} 
                                rounded-xl md:rounded-2xl flex flex-row sm:flex-col md:flex-row items-center justify-start sm:justify-center md:justify-start 
                                p-3 md:p-6 relative overflow-hidden shadow-md md:shadow-lg transition-shadow
                                ${disabled ? 'cursor-default' : 'cursor-pointer hover:shadow-xl'}
                                min-h-[80px] sm:min-h-[120px]
                            `}
                        >
                            <span className="text-white text-3xl sm:text-4xl md:text-5xl font-black mr-4 sm:mr-0 md:mr-6 sm:mb-2 md:mb-0 drop-shadow-md flex-shrink-0">
                                {ans.icon}
                            </span>

                            {showText && (
                                <span className="text-white text-base sm:text-xl md:text-3xl font-bold text-left sm:text-center md:text-left leading-tight drop-shadow-sm line-clamp-2 md:line-clamp-3">
                                    {ans.text}
                                </span>
                            )}

                            {/* Correct Indicator */}
                            {revealed && isCorrect && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 sm:top-2 sm:right-2 sm:translate-y-0 bg-white text-green-600 p-1 md:p-2 rounded-full shadow-lg"
                                >
                                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            )}
                        </motion.button>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
