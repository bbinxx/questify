import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'

interface Props {
    slide: {
        question: string
        type: 'text' | 'word_cloud'
    }
    onSubmit: (value: any) => void
    disabled: boolean
    hasSubmitted: boolean
}

export function TextQuestionInput({ slide, onSubmit, disabled, hasSubmitted }: Props) {
    const [value, setValue] = useState('')
    const [charCount, setCharCount] = useState(0)

    const isWordCloud = slide.type === 'word_cloud'
    const maxChars = isWordCloud ? 200 : 500
    const placeholder = isWordCloud
        ? 'Enter words or phrases (e.g., innovation collaboration growth)...'
        : 'Share your thoughts...'

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        if (newValue.length <= maxChars) {
            setValue(newValue)
            setCharCount(newValue.length)
        }
    }

    const handleSubmit = () => {
        if (!value.trim() || hasSubmitted) return
        onSubmit({ value: value.trim() })
        setValue('')
        setCharCount(0)
    }

    const wordCount = value.trim().split(/\s+/).filter(w => w.length > 0).length

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Input Area */}
            <div className="relative">
                <textarea
                    value={value}
                    onChange={handleChange}
                    disabled={disabled || hasSubmitted}
                    rows={isWordCloud ? 3 : 6}
                    placeholder={placeholder}
                    className={`
            w-full px-6 py-4 text-lg rounded-2xl border-2 transition-all duration-300
            resize-none focus:outline-none
            ${isWordCloud
                            ? 'border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100'
                            : 'border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                        }
            ${(disabled || hasSubmitted) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
                />

                {/* Character/Word counter */}
                <div className="absolute bottom-4 right-4 flex items-center gap-4 text-sm">
                    {isWordCloud && (
                        <span className={`px-3 py-1 rounded-full font-medium ${wordCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                            <Sparkles className="inline w-4 h-4 mr-1" />
                            {wordCount} word{wordCount !== 1 ? 's' : ''}
                        </span>
                    )}
                    <span className={`px-3 py-1 rounded-full font-medium ${charCount > maxChars * 0.9
                            ? 'bg-red-100 text-red-700'
                            : charCount > 0
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-gray-50 text-gray-400'
                        }`}>
                        {charCount}/{maxChars}
                    </span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!value.trim() || disabled || hasSubmitted}
                className={`
          w-full py-4 rounded-xl font-semibold text-lg
          transition-all duration-300 transform hover:scale-[1.02] active:scale-98
          flex items-center justify-center gap-2
          ${value.trim() && !hasSubmitted
                        ? isWordCloud
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
        `}
            >
                {hasSubmitted ? (
                    <>✓ Submitted</>
                ) : disabled ? (
                    <>Submitting...</>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        {isWordCloud ? 'Submit Words' : 'Submit Response'}
                    </>
                )}
            </button>

            {/* Helper Text */}
            {isWordCloud && !hasSubmitted && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span>Your words will help create a beautiful word cloud!</span>
                </div>
            )}
        </div>
    )
}
