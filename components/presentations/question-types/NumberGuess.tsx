import { useState } from 'react'
import { Target, TrendingUp } from 'lucide-react'

interface Props {
    slide: {
        question: string
        settings?: {
            minValue?: number
            maxValue?: number
        }
    }
    onSubmit: (value: any) => void
    disabled: boolean
    hasSubmitted: boolean
}

export function NumberGuessInput({ slide, onSubmit, disabled, hasSubmitted }: Props) {
    const min = slide.settings?.minValue ?? 0
    const max = slide.settings?.maxValue ?? 100
    const [value, setValue] = useState<string>('')
    const [showHint, setShowHint] = useState(false)

    const handleSubmit = () => {
        const numValue = parseInt(value)
        if (isNaN(numValue) || numValue < min || numValue > max || hasSubmitted) return
        onSubmit({ value: numValue })
    }

    const numValue = parseInt(value)
    const isValid = !isNaN(numValue) && numValue >= min && numValue <= max

    // Calculate position percentage for visual feedback
    const percentage = isValid ? ((numValue - min) / (max - min)) * 100 : 50

    return (
        <div className="max-w-xl mx-auto space-y-6">
            {/* Range Display */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Guess a number between</p>
                <div className="flex items-center justify-center gap-4 text-3xl font-bold text-gray-800">
                    <span className="px-4 py-2 bg-white rounded-lg shadow">{min}</span>
                    <span className="text-gray-400">—</span>
                    <span className="px-4 py-2 bg-white rounded-lg shadow">{max}</span>
                </div>
            </div>

            {/* Number Input */}
            <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-pink-500" />
                <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setShowHint(true)}
                    onBlur={() => setShowHint(false)}
                    disabled={disabled || hasSubmitted}
                    min={min}
                    max={max}
                    placeholder="Enter your guess..."
                    className={`
            w-full pl-14 pr-6 py-5 text-2xl font-bold text-center rounded-2xl
            border-2 transition-all duration-300 focus:outline-none
            ${isValid
                            ? 'border-green-400 bg-green-50 focus:ring-4 focus:ring-green-200'
                            : value
                                ? 'border-red-400 bg-red-50 focus:ring-4 focus:ring-red-200'
                                : 'border-gray-300 bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-200'
                        }
            ${(disabled || hasSubmitted) ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
                />

                {/* Visual Range Indicator */}
                {isValid && (
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Validation Message */}
            {value && !isValid && (
                <div className="flex items-center justify-center gap-2 text-red-600 text-sm animate-shake">
                    <span>❌</span>
                    <span>Please enter a number between {min} and {max}</span>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!isValid || disabled || hasSubmitted}
                className={`
          w-full py-4 rounded-xl font-semibold text-lg
          transition-all duration-300 transform hover:scale-[1.02] active:scale-98
          flex items-center justify-center gap-2
          ${isValid && !hasSubmitted
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
        `}
            >
                {hasSubmitted ? (
                    <>✓ Guess Submitted</>
                ) : disabled ? (
                    <>Submitting...</>
                ) : (
                    <>
                        <TrendingUp className="w-5 h-5" />
                        Submit Guess
                    </>
                )}
            </button>

            {/* Hint */}
            {showHint && !hasSubmitted && (
                <div className="text-center text-sm text-gray-500 animate-fade-in">
                    💡 Tip: Think carefully – you only get one guess!
                </div>
            )}
        </div>
    )
}
