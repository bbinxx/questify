"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Play, 
  Settings, 
  Copy, 
  Trash2, 
  Save, 
  Eye,
  BarChart3,
  Users,
  Calendar,
  Hash,
  Edit3,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { SlideEditor, SlideRecord, SlideElements, QuestionType } from "./slide-editor"

export type Presentation = {
  id: string
  title: string
  description?: string
  code: string
  created_at: string
  updated_at: string
  is_active: boolean
  current_slide: number
  slides: SlideRecord[]
  settings?: {
    allowAnonymous?: boolean
    showResults?: boolean
    timeLimit?: number
  }
}

interface PresentationBuilderProps {
  presentation: Presentation
  onSave: (presentation: Presentation) => Promise<void>
  onDelete?: (presentationId: string) => Promise<void>
  onStart?: (presentationId: string) => Promise<void>
  onDuplicate?: (presentationId: string) => Promise<void>
}

export function PresentationBuilder({
  presentation,
  onSave,
  onDelete,
  onStart,
  onDuplicate
}: PresentationBuilderProps) {
  const [localPresentation, setLocalPresentation] = useState<Presentation>(presentation)
  const [isEditing, setIsEditing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLocalPresentation(presentation)
  }, [presentation])

  const addSlide = async () => {
    const newSlide: SlideRecord = {
      id: `slide-${Date.now()}`,
      presentation_id: presentation.id,
      position: localPresentation.slides.length,
      elements: {
        question: "New Question",
        type: "multiple_choice",
        options: ["Option 1", "Option 2"],
        settings: {
          allowMultiple: false,
          showResults: true
        }
      }
    }

    const updatedPresentation = {
      ...localPresentation,
      slides: [...localPresentation.slides, newSlide]
    }

    setLocalPresentation(updatedPresentation)
    await onSave(updatedPresentation)
  }

  const updateSlide = async (slideId: string, updated: SlideElements) => {
    const updatedSlides = localPresentation.slides.map(slide =>
      slide.id === slideId
        ? { ...slide, elements: updated }
        : slide
    )

    const updatedPresentation = {
      ...localPresentation,
      slides: updatedSlides
    }

    setLocalPresentation(updatedPresentation)
    await onSave(updatedPresentation)
  }

  const deleteSlide = async (slideId: string) => {
    const updatedSlides = localPresentation.slides
      .filter(slide => slide.id !== slideId)
      .map((slide, index) => ({ ...slide, position: index }))

    const updatedPresentation = {
      ...localPresentation,
      slides: updatedSlides
    }

    setLocalPresentation(updatedPresentation)
    await onSave(updatedPresentation)
  }

  const duplicateSlide = async (slideId: string) => {
    const slideToDuplicate = localPresentation.slides.find(s => s.id === slideId)
    if (!slideToDuplicate) return

    const newSlide: SlideRecord = {
      id: `slide-${Date.now()}`,
      presentation_id: presentation.id,
      position: localPresentation.slides.length,
      elements: {
        ...slideToDuplicate.elements,
        question: `${slideToDuplicate.elements.question} (Copy)`
      }
    }

    const updatedPresentation = {
      ...localPresentation,
      slides: [...localPresentation.slides, newSlide]
    }

    setLocalPresentation(updatedPresentation)
    await onSave(updatedPresentation)
  }

  const moveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const currentIndex = localPresentation.slides.findIndex(s => s.id === slideId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= localPresentation.slides.length) return

    const updatedSlides = [...localPresentation.slides]
    const [movedSlide] = updatedSlides.splice(currentIndex, 1)
    updatedSlides.splice(newIndex, 0, movedSlide)

    // Update positions
    const slidesWithUpdatedPositions = updatedSlides.map((slide, index) => ({
      ...slide,
      position: index
    }))

    const updatedPresentation = {
      ...localPresentation,
      slides: slidesWithUpdatedPositions
    }

    setLocalPresentation(updatedPresentation)
    await onSave(updatedPresentation)
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(localPresentation.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy room code:', err)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(localPresentation)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save presentation:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStart = async () => {
    if (onStart) {
      await onStart(localPresentation.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? (
                  <input
                    type="text"
                    value={localPresentation.title}
                    onChange={(e) => setLocalPresentation(p => ({ ...p, title: e.target.value }))}
                    className="border-none bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    placeholder="Presentation Title"
                  />
                ) : (
                  localPresentation.title
                )}
              </h1>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Hash size={14} />
                <span className="font-mono">{localPresentation.code}</span>
                <button
                  onClick={copyRoomCode}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy room code"
                >
                  {copied ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  {onStart && (
                    <button
                      onClick={handleStart}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Play size={16} />
                      Start Presentation
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Presentation Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allow Anonymous Participation
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localPresentation.settings?.allowAnonymous || false}
                    onChange={(e) => setLocalPresentation(p => ({
                      ...p,
                      settings: { ...p.settings, allowAnonymous: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Allow anonymous responses</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Show Results to Participants
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localPresentation.settings?.showResults || false}
                    onChange={(e) => setLocalPresentation(p => ({
                      ...p,
                      settings: { ...p.settings, showResults: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Show live results</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={localPresentation.settings?.timeLimit || ''}
                  onChange={(e) => setLocalPresentation(p => ({
                    ...p,
                    settings: { ...p.settings, timeLimit: parseInt(e.target.value) || undefined }
                  }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="No limit"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span>{localPresentation.slides.length} slides</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Created {new Date(localPresentation.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>0 participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Slide Button */}
        <div className="mb-8">
          <button
            onClick={addSlide}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Add New Slide
          </button>
        </div>

        {/* Slides List */}
        <div className="space-y-6">
          {localPresentation.slides.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No slides yet</h3>
              <p className="text-gray-500 mb-4">Create your first slide to get started</p>
              <button
                onClick={addSlide}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add First Slide
              </button>
            </div>
          ) : (
            localPresentation.slides.map((slide, index) => (
              <div key={slide.id} className="relative">
                {/* Slide Controls */}
                <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                  {index > 0 && (
                    <button
                      onClick={() => moveSlide(slide.id, 'up')}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                  )}
                  {index < localPresentation.slides.length - 1 && (
                    <button
                      onClick={() => moveSlide(slide.id, 'down')}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  )}
                </div>

                <SlideEditor
                  slide={slide}
                  onUpdate={updateSlide}
                  onDelete={deleteSlide}
                  onDuplicate={duplicateSlide}
                  isActive={localPresentation.current_slide === index}
                />
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        {localPresentation.slides.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>
                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(localPresentation.id)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {onDelete && (
                  <button
                    onClick={() => onDelete(localPresentation.id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                {onStart && (
                  <button
                    onClick={handleStart}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                  >
                    <Play size={18} />
                    Start Presentation
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
