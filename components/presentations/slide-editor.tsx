"use client"

import { useState } from "react"
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
  ArrowUp,
  ArrowDown
} from "lucide-react"

export type QuestionType = 'multiple_choice' | 'single_choice' | 'text' | 'word_cloud' | 'question_only'

export type SlideElements = {
  question: string
  type: QuestionType
  options: string[]
  settings: {
    allowMultiple?: boolean
    showResults?: boolean
    timeLimit?: number
    maxLength?: number
    required?: boolean
  }
}

export type SlideRecord = {
  id: string
  presentation_id: string
  position: number
  elements: SlideElements
}

interface SlideEditorProps {
  slide: SlideRecord
  onUpdate: (slideId: string, updated: SlideElements) => Promise<void>
  onDelete: (slideId: string) => Promise<void>
  onDuplicate?: (slideId: string) => Promise<void>
  isActive?: boolean
}

export function SlideEditor({
  slide,
  onUpdate,
  onDelete,
  onDuplicate,
  isActive = false
}: SlideEditorProps) {
  const [local, setLocal] = useState<SlideElements>(slide.elements)
  const [isEditing, setIsEditing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const questionTypes = [
    {
      type: 'multiple_choice' as QuestionType,
      label: 'Multiple Choice',
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Select multiple options'
    },
    {
      type: 'single_choice' as QuestionType,
      label: 'Single Choice',
      icon: Circle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Select one option'
    },
    {
      type: 'text' as QuestionType,
      label: 'Text Response',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Free text answers'
    },
    {
      type: 'word_cloud' as QuestionType,
      label: 'Word Cloud',
      icon: Cloud,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Word frequency visualization'
    },
    {
      type: 'question_only' as QuestionType,
      label: 'Question Only',
      icon: HelpCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      description: 'Display for discussion'
    }
  ]

  const currentType = questionTypes.find(t => t.type === local.type) || questionTypes[0]

  const handleUpdate = async () => {
    await onUpdate(slide.id, local)
    setIsEditing(false)
  }

  const addOption = () => {
    setLocal(prev => ({
      ...prev,
      options: [...prev.options, `Option ${prev.options.length + 1}`]
    }))
  }

  const removeOption = (index: number) => {
    if (local.options.length > 1) {
      setLocal(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOption = (index: number, value: string) => {
    setLocal(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }))
  }

  const renderQuestionTypeSelector = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">Question Type</label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {questionTypes.map((type) => {
          const Icon = type.icon
          const isSelected = local.type === type.type
          return (
            <button
              key={type.type}
              onClick={() => setLocal(prev => ({ ...prev, type: type.type }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? `${type.bgColor} ${type.borderColor} border-2`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
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
    if (local.type === 'text' || local.type === 'word_cloud' || local.type === 'question_only') {
      return null
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Options {local.type === 'multiple_choice' && '(Select multiple)'}
          </label>
          <button
            onClick={addOption}
            className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            <Plus size={14} />
            Add Option
          </button>
        </div>
        
        <div className="space-y-2">
          {local.options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="flex-1 rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder={`Option ${idx + 1}`}
              />
              {local.options.length > 1 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
        >
          <Settings size={14} />
          {showSettings ? 'Hide' : 'Show'} Settings
        </button>
      </div>
      
      {showSettings && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {local.type === 'multiple_choice' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={local.settings.allowMultiple || false}
                onChange={(e) => setLocal(prev => ({
                  ...prev,
                  settings: { ...prev.settings, allowMultiple: e.target.checked }
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Allow multiple selections</span>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={local.settings.showResults || false}
              onChange={(e) => setLocal(prev => ({
                ...prev,
                settings: { ...prev.settings, showResults: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show results to participants</span>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={local.settings.required || false}
              onChange={(e) => setLocal(prev => ({
                ...prev,
                settings: { ...prev.settings, required: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Required response</span>
          </div>
          
          {(local.type === 'text' || local.type === 'word_cloud') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={local.settings.maxLength || ''}
                onChange={(e) => setLocal(prev => ({
                  ...prev,
                  settings: { ...prev.settings, maxLength: parseInt(e.target.value) || undefined }
                }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="No limit"
                min="0"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              value={local.settings.timeLimit || ''}
              onChange={(e) => setLocal(prev => ({
                ...prev,
                settings: { ...prev.settings, timeLimit: parseInt(e.target.value) || undefined }
              }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="No limit"
              min="0"
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
              Slide {slide.position + 1}
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
            >
              <Copy size={16} />
            </button>
          )}
          <button
            onClick={() => onDelete(slide.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete slide"
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
          value={local.question}
          onChange={(e) => setLocal(prev => ({ ...prev, question: e.target.value }))}
          className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
          placeholder="Enter your question..."
          rows={3}
        />
      </div>

      {/* Options Editor */}
      {renderOptionsEditor()}

      {/* Settings */}
      {renderSettings()}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => setIsEditing(false)}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
