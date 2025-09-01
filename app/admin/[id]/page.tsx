"use client"

import useSWR from "swr"
import Link from "next/link"
import { useMemo, useState } from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  BarChart3, 
  Plus, 
  Pencil, 
  Play, 
  Settings,
  Copy,
  Trash2,
  Save,
  Eye,
  ArrowUp,
  ArrowDown,
  Hash,
  Edit3,
  Calendar
} from "lucide-react"
import { SlideEditor, type SlideRecord, type SlideElements, type QuestionType } from "@/components/presentations/slide-editor"
import { ResultChart } from "@/components/presentations/result-chart"
import { usePresentationRealtime } from "@/hooks/use-presentation-realtime"
import { useParams } from "next/navigation"
import { getBrowserSupabase } from "@/lib/supabase/client"

type Presentation = {
  id: string
  title: string
  code: string
  current_slide: number
  show_results: boolean
  created_at: string
  updated_at: string
  settings?: {
    allowAnonymous?: boolean
    showResults?: boolean
    timeLimit?: number
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminEditorPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const { data, mutate } = useSWR<{ presentation: Presentation; slides: SlideRecord[] }>(
    id ? `/api/presentations/${id}` : null,
    fetcher,
  )

  const [busy, setBusy] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)

  usePresentationRealtime({
    presentationId: id,
    onPresentationUpdate: () => mutate(),
    onResponse: () => mutate(),
    onSlideChange: () => mutate(),
    onControl: () => mutate(),
  })

  const presentation = data?.presentation
  const slides = useMemo(() => (data?.slides ?? []).sort((a, b) => a.position - b.position), [data?.slides])

  const currentSlide = presentation && slides[presentation.current_slide]

  const broadcastControl = (nextState: { current_slide: number; show_results: boolean }) => {
    try {
      const supabase = getBrowserSupabase()
      supabase.channel(`control:presentations:${id}`).send({
        type: "broadcast",
        event: "control",
        payload: nextState,
      })
    } catch {}
  }

  const updatePresentation = async (payload: Partial<Presentation>) => {
    if (!presentation) return
    setBusy(true)
    await fetch(`/api/presentations/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
    setBusy(false)
    const nextState = {
      current_slide: payload.current_slide ?? presentation.current_slide,
      show_results: payload.show_results ?? presentation.show_results,
    }
    broadcastControl(nextState)
    mutate()
  }

  const addSlide = async () => {
    setBusy(true)
    const newSlide: SlideRecord = {
      id: `slide-${Date.now()}`,
      presentation_id: id!,
      position: slides.length,
      elements: {
        question: "New Question",
        type: "multiple_choice",
        options: ["Option 1", "Option 2"],
        settings: {
          allowMultiple: false,
          showResults: true,
          required: false
        }
      }
    }

    await fetch(`/api/slides`, {
      method: "POST",
      body: JSON.stringify(newSlide),
    })
    setBusy(false)
    mutate()
  }

  const updateSlide = async (slideId: string, updated: SlideElements) => {
    setBusy(true)
    await fetch(`/api/slides/${slideId}`, {
      method: "PATCH",
      body: JSON.stringify({ elements: updated }),
    })
    setBusy(false)
    mutate()
  }

  const deleteSlide = async (slideId: string) => {
    setBusy(true)
    await fetch(`/api/slides/${slideId}`, { method: "DELETE" })
    setBusy(false)
    mutate()
  }

  const duplicateSlide = async (slideId: string) => {
    const slideToDuplicate = slides.find(s => s.id === slideId)
    if (!slideToDuplicate) return

    setBusy(true)
    const newSlide: SlideRecord = {
      id: `slide-${Date.now()}`,
      presentation_id: id!,
      position: slides.length,
      elements: {
        ...slideToDuplicate.elements,
        question: `${slideToDuplicate.elements.question} (Copy)`
      }
    }

    await fetch(`/api/slides`, {
      method: "POST",
      body: JSON.stringify(newSlide),
    })
    setBusy(false)
    mutate()
  }

  const moveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(s => s.id === slideId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= slides.length) return

    setBusy(true)
    await fetch(`/api/slides/${slideId}`, {
      method: "PATCH",
      body: JSON.stringify({ position: newIndex }),
    })
    setBusy(false)
    mutate()
  }

  const copyRoomCode = async () => {
    if (!presentation) return
    try {
      await navigator.clipboard.writeText(presentation.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy room code:', err)
    }
  }

  const handleTitleEdit = () => {
    if (presentation) {
      setTitleDraft(presentation.title)
      setIsEditingTitle(true)
    }
  }

  const saveTitle = async () => {
    if (!presentation) return
    setBusy(true)
    await fetch(`/api/presentations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: titleDraft }),
    })
    setBusy(false)
    setIsEditingTitle(false)
    mutate()
  }

  const cancelTitleEdit = () => {
    setIsEditingTitle(false)
  }

  if (!presentation) return <div className="p-8">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      className="text-xl font-semibold border-none bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      placeholder="Presentation Title"
                    />
                    <button
                      onClick={saveTitle}
                      disabled={busy}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={cancelTitleEdit}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900">{presentation.title}</h1>
                    <button
                      onClick={handleTitleEdit}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Hash size={14} />
                <span className="font-mono">{presentation.code}</span>
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
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Settings size={16} />
                Settings
              </button>
              <Link
                href={`/admin/${presentation.id}/present`}
                className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
              >
                <Play size={16} />
                Present
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-gray-800">
                ← Back
              </Link>
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
                    checked={presentation.settings?.allowAnonymous || false}
                    onChange={(e) => updatePresentation({
                      settings: { ...presentation.settings, allowAnonymous: e.target.checked }
                    })}
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
                    checked={presentation.settings?.showResults || false}
                    onChange={(e) => updatePresentation({
                      settings: { ...presentation.settings, showResults: e.target.checked }
                    })}
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
                  value={presentation.settings?.timeLimit || ''}
                  onChange={(e) => updatePresentation({
                    settings: { ...presentation.settings, timeLimit: parseInt(e.target.value) || undefined }
                  })}
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
              <span>{slides.length} slides</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Created {new Date(presentation.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>0 participants</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Panel - Slide Editor */}
          <div>
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Slide Editor</h2>
                <button
                  onClick={addSlide}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add Slide
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-4">
                {slides.length === 0 ? (
                  <div className="text-center py-8">
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
                  slides.map((slide, index) => (
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
                        {index < slides.length - 1 && (
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
                        isActive={presentation.current_slide === index}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Controls */}
          <div>
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-semibold">Preview & Controls</h2>
              
              <div className="min-h-96 rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
                {currentSlide ? (
                  presentation.show_results ? (
                    <ResultsBlock presentationId={presentation.id} slide={currentSlide} />
                  ) : (
                    <div className="space-y-6 text-center">
                      <h2 className="text-2xl font-bold">{currentSlide.elements.question}</h2>
                      {currentSlide.elements.type === 'multiple_choice' || currentSlide.elements.type === 'single_choice' ? (
                        <div className="grid grid-cols-1 gap-4">
                          {currentSlide.elements.options.map((opt, i) => (
                            <button key={i} className="rounded-lg border-2 border-gray-300 bg-white p-4 text-left hover:bg-gray-50">
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : currentSlide.elements.type === 'text' ? (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">Text response area</p>
                        </div>
                      ) : currentSlide.elements.type === 'word_cloud' ? (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">Word cloud input area</p>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">Question only - no response needed</p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center text-gray-500">No slide</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsBlock({ presentationId, slide }: { presentationId: string; slide: SlideRecord }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Results</h3>
      <ResultChart presentationId={presentationId} slideId={slide.id} />
    </div>
  )
}
