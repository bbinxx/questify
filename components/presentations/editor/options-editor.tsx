import { Slide } from "@/app/page"
import { Plus, Minus } from "lucide-react"

interface OptionsEditorProps {
    options: string[]
    onChange: (options: string[]) => void
    disabled?: boolean
}

export function OptionsEditor({ options, onChange, disabled }: OptionsEditorProps) {
    const updateOption = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        onChange(newOptions)
    }

    const removeOption = (index: number) => {
        if (options.length > 1) {
            onChange(options.filter((_, i) => i !== index))
        }
    }

    const addOption = () => {
        onChange([...options, `Option ${options.length + 1}`])
    }

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Options
                </label>
            </div>

            <div className="space-y-2">
                {options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(idx, e.target.value)}
                                className="w-full rounded-md border border-gray-300 pl-3 pr-8 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                placeholder={`Option ${idx + 1}`}
                                disabled={disabled}
                            />
                        </div>
                        {options.length > 1 && (
                            <button
                                onClick={() => removeOption(idx)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                disabled={disabled}
                            >
                                <Minus size={16} />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={addOption}
                    className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all font-medium text-sm"
                    disabled={disabled}
                >
                    <Plus size={14} />
                    Add Option
                </button>
            </div>
        </div>
    )
}
