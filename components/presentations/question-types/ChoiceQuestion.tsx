import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

interface Props {
    slide: {
        question: string
        options: string[]
        type: 'single_choice' | 'multiple_choice'
    }
    onSubmit: (value: any) => void
    disabled: boolean
    hasSubmitted: boolean
}

export function ChoiceQuestionInput({ slide, onSubmit, disabled, hasSubmitted }: Props) {
    const [selectedIndices, setSelectedIndices] = useState<number[]>([])
    const isMultiple = slide.type === 'multiple_choice'

    const handleSelect = (index: number) => {
        if (hasSubmitted || disabled) return

        if (isMultiple) {
            // Multiple choice - toggle selection
            setSelectedIndices(prev =>
                prev.includes(index)
                    ? prev.filter(i => i !== index)
                    : [...prev, index]
            )
        } else {
            // Single choice - select and auto-submit
            setSelectedIndices([index])
            const optionText = slide.options[index]
            onSubmit({ value: optionText })
        }
    }

    const handleSubmitMultiple = () => {
        if (selectedIndices.length === 0) return
        const selectedOptions = selectedIndices.map(i => slide.options[i])
        onSubmit({ value: selectedOptions })
    }

    return (
        <div className="space-y-6">
            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {slide.options.map((option, index) => {
                    const isSelected = selectedIndices.includes(index)
                    const isDisabled = hasSubmitted || disabled

                    return (
                        <button
                            key={index}
                            onClick={() => handleSelect(index)}
                            disabled={isDisabled}
                            className={`
                group relative p-6 rounded-xl text-left transition-all duration-300 transform
                hover:scale-105 active:scale-95
                ${isSelected
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl ring-4 ring-green-200'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                                }
                ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
                ${isDisabled && isSelected ? 'ring-green-300' : ''}
              `}
                        >
                            {/* Selection Indicator */}
                            <div className="absolute top-4 right-4">
                                {isSelected ? (
                                    <CheckCircle2 className="w-6 h-6 text-white animate-scale-in" />
                                ) : (
                                    <Circle className="w-6 h-6 text-white/60 group-hover:text-white/80" />
                                )}
                            </div>

                            {/* Option Letter */}
                            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                                {String.fromCharCode(65 + index)}
                            </div>

                            {/* Option Text */}
                            <div className="mt-8 text-lg font-semibold leading-tight">
                                {option}
                            </div>

                            {/* Checkmark animation */}
                            {isSelected && (
                                <div className="absolute inset-0 rounded-xl bg-green-400/10 animate-pulse" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Submit button for multiple choice */}
            {isMultiple && (
                <div className="flex justify-center">
                    <button
                        onClick={handleSubmitMultiple}
                        disabled={selectedIndices.length === 0 || hasSubmitted || disabled}
                        className={`
              px-8 py-3 rounded-full font-semibold text-lg shadow-lg
              transition-all duration-300 transform hover:scale-105 active:scale-95
              ${selectedIndices.length > 0 && !hasSubmitted
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }
            `}
                    >
                        {hasSubmitted ? '✓ Submitted' : `Submit ${selectedIndices.length} Choice${selectedIndices.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            )}

            {/* Helper text */}
            <p className="text-center text-sm text-gray-500">
                {isMultiple
                    ? 'Select one or more options, then click Submit'
                    : 'Click an option to submit your answer'
                }
            </p>
        </div>
    )
}
