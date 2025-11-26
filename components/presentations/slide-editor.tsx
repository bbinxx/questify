import { useState, useEffect } from "react"
import {
  Trash2,
  Copy,
  Settings,
  CheckSquare,
  Circle,
  MessageSquare,
  Cloud,
  HelpCircle,
  Type,
  Plus,
  Minus,
} from "lucide-react"
import { Slide } from "@/app/page"

interface SlideEditorProps {
  slide: Slide
  onUpdate: (slideId: string, updated: Partial<Slide>) => Promise<void>
  onDelete: (slideId: string) => Promise<void>
  onDuplicate?: (slideId: string) => Promise<void>
  isActive?: boolean
  busy?: boolean
}

export function SlideEditor({
  slide,
  onUpdate,
  onDelete,
  onDuplicate,
  isActive = false,
  busy = false,
}: SlideEditorProps) {
  const [localSlide, setLocalSlide] = useState<Slide>(slide)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setLocalSlide(slide)
  }, [slide])

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
      description: 'Word frequency visualization'
    },
    {
      type: 'question_only' as Slide['type'],
      label: 'Question Only',
      icon: HelpCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      description: 'Display for discussion'
    }
  ]

  const currentType = questionTypes.find(t => t.type === localSlide.type) || questionTypes[0]

  const handleUpdate = async (updates: Partial<Slide>) => {
    const updatedSlide = { ...localSlide, ...updates }
    setLocalSlide(updatedSlide)
    await onUpdate(slide.id, updatedSlide)
  }

  const addOption = () => {
    handleUpdate({
      options: [...localSlide.options, `Option ${localSlide.options.length + 1}`]
    })
  }

  const removeOption = (index: number) => {
    if (localSlide.options.length > 1) {
      handleUpdate({
        options: localSlide.options.filter((_, i) => i !== index)
      })
    }
  }

  const updateOption = (index: number, value: string) => {
    handleUpdate({
      options: localSlide.options.map((opt, i) => i === index ? value : opt)
    })
  }

  const renderQuestionTypeSelector = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">Question Type</label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {questionTypes.map((type) => {
          const Icon = type.icon
          const isSelected = localSlide.type === type.type
          return (
            <button
              key={type.type}
              onClick={() => handleUpdate({ type: type.type, options: type.type === 'text' || type.type === 'word_cloud' || type.type === 'question_only' ? [] : ["Option 1", "Option 2"] })}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? `${type.bgColor} ${type.borderColor} border-2`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              disabled={busy}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${type.color}`} />
                <div className="text-left">
                  <div className={`font-medium ${isSelected ? type.color.replace('text-', 'text-') : 'text-gray-900'}`}>
                    {type.label}
                  </div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderOptionsEditor = () => {
    if (localSlide.type === 'text' || localSlide.type === 'word_cloud' || localSlide.type === 'question_only') {
      return null
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Options {localSlide.type === 'multiple_choice' && '(Select multiple)'}
          </label>
          <button
            onClick={addOption}
            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            disabled={busy}
          >
            <Plus size={14} />
            Add Option
          </button>
        </div>

        <div className="space-y-2">
          {localSlide.options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="flex-1 rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder={`Option ${idx + 1}`}
                disabled={busy}
              />
              {localSlide.options.length > 1 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  disabled={busy}
                >
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSettings = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">Settings</label>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
          disabled={busy}
        >
          <Settings size={14} />
          {showSettings ? 'Hide' : 'Show'} Settings
        </button>
      </div>

      {showSettings && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {localSlide.type === 'multiple_choice' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={localSlide.settings.allowMultiple || false}
                onChange={(e) => handleUpdate({
                  settings: { ...localSlide.settings, allowMultiple: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={busy}
              />
              <span className="ml-2 text-sm text-gray-700">Allow multiple selections</span>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={localSlide.settings.showResults || false}
              onChange={(e) => handleUpdate({
                settings: { ...localSlide.settings, showResults: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={busy}
            />
            <span className="ml-2 text-sm text-gray-700">Show results to participants</span>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={localSlide.settings.required || false}
              onChange={(e) => handleUpdate({
                settings: { ...localSlide.settings, required: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={busy}
            />
            <span className="ml-2 text-sm text-gray-700">Required response</span>
          </div>

          {(localSlide.type === 'text' || localSlide.type === 'word_cloud') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={localSlide.settings.maxLength || ''}
                onChange={(e) => handleUpdate({
                  settings: { ...localSlide.settings, maxLength: parseInt(e.target.value) || undefined }
                })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="No limit"
                min="0"
                disabled={busy}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              value={localSlide.settings.timeLimit || ''}
              onChange={(e) => handleUpdate({
                settings: { ...localSlide.settings, timeLimit: parseInt(e.target.value) || undefined }
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="No limit"
              min="0"
              disabled={busy}
            />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={`mb-6 rounded-lg border-2 p-6 transition-all ${
      isActive
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${currentType.bgColor}`}>
            <currentType.icon className={`h-5 w-5 ${currentType.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Slide {slide.order + 1}
            </h3>
            <p className="text-sm text-gray-500">{currentType.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(slide.id)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Duplicate slide"
              disabled={busy}
            >
              <Copy size={16} />
            </button>
          )}
          <button
            onClick={() => onDelete(slide.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete slide"
            disabled={busy}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Question Type Selector */}
      {renderQuestionTypeSelector()}

      {/* Question Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
        <textarea
          value={localSlide.question}
          onChange={(e) => handleUpdate({ question: e.target.value })}
          className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
          placeholder="Enter your question..."
          rows={3}
          disabled={busy}
        />
      </div>

      {/* Options Editor */}
      {renderOptionsEditor()}

      {/* Settings */}
      {renderSettings()}
    </div>
  )
}