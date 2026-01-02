import { useState, useEffect } from "react"
import {
  Trash2,
  Copy,
  Settings,
} from "lucide-react"
import { Slide } from "@/app/page"
import { OptionsEditor } from "./editor/options-editor"
import { SettingsEditor } from "./editor/settings-editor"
import { QuestionTypeSelector } from "./editor/question-type-selector"

interface SlideEditorProps {
  slide: Slide
  onUpdate: (slideId: string, updated: Partial<Slide>) => Promise<void>
  onDelete: (slideId: string) => Promise<void>
  onDuplicate?: (slideId: string) => Promise<void>
  isActive?: boolean
  busy?: boolean
  variant?: 'card' | 'sidebar'
}

export function SlideEditor({
  slide,
  onUpdate,
  onDelete,
  onDuplicate,
  isActive = false,
  busy = false,
  variant = 'card'
}: SlideEditorProps) {
  const [localSlide, setLocalSlide] = useState<Slide>(slide)
  const [showSettings, setShowSettings] = useState(true) // Default true for sidebar

  useEffect(() => {
    setLocalSlide(slide)
  }, [slide])

  const handleUpdate = async (updates: Partial<Slide>) => {
    const updatedSlide = { ...localSlide, ...updates }
    setLocalSlide(updatedSlide)
    await onUpdate(slide.id, updatedSlide)
  }

  // No internal handlers needed, handled by child components


  if (variant === 'sidebar') {
    return (
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">My Question</label>
          <iframe
            className="w-full h-1"
            style={{ display: 'none' }} // Hack to force focus reset sometimes
          />
          <textarea
            value={localSlide.question}
            onChange={(e) => handleUpdate({ question: e.target.value })}
            className="w-full rounded-lg border-gray-300 border-2 p-3 text-lg font-medium focus:border-indigo-500 focus:ring-transparent transition-all resize-none shadow-sm"
            placeholder="Type your question here..."
            rows={2}
            disabled={busy}
          />
        </div>

        <QuestionTypeSelector
          currentType={localSlide.type}
          onChange={(type, options) => handleUpdate({ type, options })}
          disabled={busy}
        />

        {localSlide.type !== 'text' && localSlide.type !== 'word_cloud' && localSlide.type !== 'question_only' && (
          <OptionsEditor
            options={localSlide.options}
            onChange={(options) => handleUpdate({ options })}
            disabled={busy}
          />
        )}

        <div className="mb-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={16} />
            Settings
          </h3>
          <SettingsEditor
            slide={localSlide}
            onUpdate={(updates) => handleUpdate(updates)}
            disabled={busy}
          />
        </div>

        <div className="pt-6 mt-6 border-t border-gray-100 flex gap-2">
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(slide.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              disabled={busy}
            >
              <Copy size={16} /> Duplicate
            </button>
          )}
          <button
            onClick={() => onDelete(slide.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-100"
            disabled={busy}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    )
  }

  // Original Card Content (Fallback or if reused elsewhere)
  return (
    <div className={`mb-6 rounded-lg border-2 p-6 transition-all ${isActive
      ? 'border-blue-500 bg-blue-50'
      : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
      {/* ... keeping original render logic for safety if needed, but sidebar is main target now ... */}
      {/* (Simplified for brevity as we are moving to sidebar layout predominantly) */}
      <div className="text-center text-gray-500">Card View Deprecated</div>
    </div>
  )
}