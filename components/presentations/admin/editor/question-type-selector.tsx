import { Slide } from "@/app/page"
import { CheckSquare, Circle, MessageSquare, Cloud, HelpCircle } from "lucide-react"

interface QuestionTypeSelectorProps {
    currentType: Slide['type']
    onChange: (type: Slide['type'], options?: string[]) => void
    disabled?: boolean
}

const questionTypes = [
    {
        type: 'multiple_choice' as Slide['type'],
        label: 'Multiple Choice',
        icon: CheckSquare,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        description: 'Select multiple options'
    },
    {
        type: 'single_choice' as Slide['type'],
        label: 'Single Choice',
        icon: Circle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        description: 'Select one option'
    },
    {
        type: 'text' as Slide['type'],
        label: 'Text Response',
        icon: MessageSquare,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        description: 'Free text answers'
    },
    {
        type: 'word_cloud' as Slide['type'],
        label: 'Word Cloud',
        icon: Cloud,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        description: 'Word visualization'
    },
    {
        type: 'question_only' as Slide['type'],
        label: 'Question Only',
        icon: HelpCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        description: 'Display only'
    }
]

export function QuestionTypeSelector({ currentType, onChange, disabled }: QuestionTypeSelectorProps) {
    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Question Type</label>
            <div className="grid grid-cols-2 gap-2">
                {questionTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = currentType === type.type
                    return (
                        <button
                            key={type.type}
                            onClick={() => onChange(type.type, type.type === 'text' || type.type === 'word_cloud' || type.type === 'question_only' ? [] : ["Option 1", "Option 2"])}
                            className={`p-3 rounded-lg border text-left transition-all flex flex-col items-center justify-center gap-2 ${isSelected
                                ? `${type.bgColor} ${type.borderColor} border-2 ring-1 ring-blue-500`
                                : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            disabled={disabled}
                            title={type.description}
                        >
                            <Icon className={`h-6 w-6 ${type.color}`} />
                            <span className={`text-xs font-semibold ${isSelected ? type.color : 'text-gray-700'}`}>
                                {type.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
