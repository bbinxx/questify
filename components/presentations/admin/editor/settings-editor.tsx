import { Slide } from "@/app/page"

interface SettingsEditorProps {
    slide: Slide
    onUpdate: (updates: Partial<Slide>) => void
    disabled?: boolean
}

export function SettingsEditor({ slide, onUpdate, disabled }: SettingsEditorProps) {
    return (
        <div className="space-y-4">
            {slide.type === 'multiple_choice' && (
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                        type="checkbox"
                        checked={slide.settings?.allowMultiple || false}
                        onChange={(e) => onUpdate({
                            settings: { ...slide.settings, allowMultiple: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        disabled={disabled}
                    />
                    <span className="text-sm text-gray-700">Allow multiple selections</span>
                </label>
            )}

            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                    type="checkbox"
                    checked={slide.settings?.showResults ?? true}
                    onChange={(e) => onUpdate({
                        settings: { ...slide.settings, showResults: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    disabled={disabled}
                />
                <span className="text-sm text-gray-700">Show result chart</span>
            </label>

            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Time Limit
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={slide.settings?.timeLimit || ''}
                        onChange={(e) => onUpdate({
                            settings: { ...slide.settings, timeLimit: parseInt(e.target.value) || undefined }
                        })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="0 (No limit)"
                        min="0"
                        disabled={disabled}
                    />
                    <span className="text-sm text-gray-500">sec</span>
                </div>
            </div>
        </div>
    )
}
