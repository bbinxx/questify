"use client"

import useSWR from "swr"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { PowerPointLayout } from "@/components/presentations/editor/powerpoint-layout"
import { QuestionTypes } from "@/components/presentations/editor/question-types"
import AdminPresentPage from "@/app/admin/[id]/present/page"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialView = searchParams.get("view") || "editor"
  const [activeTab, setActiveTab] = useState(initialView)

  const { data, error, isLoading } = useSWR<{ presentation: Presentation; slides: SlideRecord[] }>(
    id ? `/api/presentations/${id}` : null,
    fetcher,
  )

  const [busy, setBusy] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null);

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
    } catch (err) {
      console.error("Failed to broadcast control:", err);
      setApiError("Failed to broadcast control.");
    }
  }

  const updatePresentation = async (payload: Partial<Presentation>) => {
    if (!presentation) return
    setBusy(true)
    setApiError(null);
    try {
      const res = await fetch(`/api/presentations/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
      if (!res.ok) {
        throw new Error(`Failed to update presentation: ${res.statusText}`);
      }
      const nextState = {
        current_slide: payload.current_slide ?? presentation.current_slide,
        show_results: payload.show_results ?? presentation.show_results,
      }
      broadcastControl(nextState)
      mutate()
    } catch (err) {
      console.error("Failed to update presentation:", err);
      setApiError("Failed to update presentation.");
    } finally {
      setBusy(false)
    }
  }

  const addSlide = async (type: QuestionType = "multiple_choice") => {
    setBusy(true)
    setApiError(null);
    try {
      const newSlide: SlideRecord = {
        id: `slide-${Date.now()}`,
        presentation_id: id!,
        position: slides.length,
        elements: {
          question: "New Question",
          type: type,
          options: ["Option 1", "Option 2"],
          settings: {
            allowMultiple: false,
            showResults: true,
            required: false
          }
        }
      }

      const res = await fetch(`/api/slides`, {
        method: "POST",
        body: JSON.stringify(newSlide),
      })
      if (!res.ok) {
        throw new Error(`Failed to add slide: ${res.statusText}`);
      }
      mutate()
    } catch (err) {
      console.error("Failed to add slide:", err);
      setApiError("Failed to add slide.");
    } finally {
      setBusy(false)
    }
  }

  const updateSlide = async (slideId: string, updated: SlideElements) => {
    setBusy(true)
    setApiError(null);
    try {
      const res = await fetch(`/api/slides/${slideId}`, {
        method: "PATCH",
        body: JSON.stringify({ elements: updated }),
      })
      if (!res.ok) {
        throw new Error(`Failed to update slide: ${res.statusText}`);
      }
      mutate()
    } catch (err) {
      console.error("Failed to update slide:", err);
      setApiError("Failed to update slide.");
    } finally {
      setBusy(false)
    }
  }

  const deleteSlide = async (slideId: string) => {
    setBusy(true)
    setApiError(null);
    try {
      const res = await fetch(`/api/slides/${slideId}`, { method: "DELETE" })
      if (!res.ok) {
        throw new Error(`Failed to delete slide: ${res.statusText}`);
      }
      mutate()
    } catch (err) {
      console.error("Failed to delete slide:", err);
      setApiError("Failed to delete slide.");
    } finally {
      setBusy(false)
    }
  }

  const duplicateSlide = async (slideId: string) => {
    const slideToDuplicate = slides.find(s => s.id === slideId)
    if (!slideToDuplicate) return

    setBusy(true)
    setApiError(null);
    try {
      const newSlide: SlideRecord = {
        id: `slide-${Date.now()}`,
        presentation_id: id!,
        position: slides.length,
        elements: {
          ...slideToDuplicate.elements,
          question: `${slideToDuplicate.elements.question} (Copy)`
        }
      }

      const res = await fetch(`/api/slides`, {
        method: "POST",
        body: JSON.stringify(newSlide),
      })
      if (!res.ok) {
        throw new Error(`Failed to duplicate slide: ${res.statusText}`);
      }
      mutate()
    } catch (err) {
      console.error("Failed to duplicate slide:", err);
      setApiError("Failed to duplicate slide.");
    } finally {
      setBusy(false)
    }
  }

  const moveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(s => s.id === slideId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= slides.length) return

    setBusy(true)
    setApiError(null);
    try {
      const res = await fetch(`/api/slides/${slideId}`, {
        method: "PATCH",
        body: JSON.stringify({ position: newIndex }),
      })
      if (!res.ok) {
        throw new Error(`Failed to move slide: ${res.statusText}`);
      }
      mutate()
    } catch (err) {
      console.error("Failed to move slide:", err);
      setApiError("Failed to move slide.");
    } finally {
      setBusy(false)
    }
  }

  const copyRoomCode = async () => {
    if (!presentation) return
    try {
      await navigator.clipboard.writeText(presentation.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy room code:', err)
      setApiError("Failed to copy room code.");
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
    setApiError(null);
    try {
      const res = await fetch(`/api/presentations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleDraft }),
      })
      if (!res.ok) {
        throw new Error(`Failed to save title: ${res.statusText}`);
      }
      setIsEditingTitle(false)
      mutate()
    } catch (err) {
      console.error("Failed to save title:", err);
      setApiError("Failed to save title.");
    } finally {
      setBusy(false)
    }
  }

  const cancelTitleEdit = () => {
    setIsEditingTitle(false)
  }

  useEffect(() => {
    router.push(`?view=${activeTab}`, undefined, { shallow: true })
  }, [activeTab, router])

  if (isLoading) return <div className="p-8">Loading presentation...</div>
  if (error) return <div className="p-8 text-red-500">Error loading presentation: {error.message}</div>

  if (!presentation) return <div className="p-8">No presentation found.</div>

  const slideList = (
    <div className="max-h-96 overflow-y-auto space-y-4">
      {slides.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No slides yet</h3>
          <p className="text-gray-500 mb-4">Create your first slide to get started</p>
          <button
            onClick={() => addSlide("multiple_choice")}
            disabled={busy}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {busy ? "Adding..." : "Add First Slide"}
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
                  disabled={busy}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Move up"
                >
                  <ArrowUp size={14} />
                </button>
              )}
              {index < slides.length - 1 && (
                <button
                  onClick={() => moveSlide(slide.id, 'down')}
                  disabled={busy}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Move down"
                >
                  <ArrowDown size={14} />
                </button>
              )}
            </div>
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer ${presentation.current_slide === index ? "border-blue-500" : "border-gray-200"}`}
              onClick={() => updatePresentation({ current_slide: index })}
            >
              <h3 className="font-semibold">{index + 1}. {slide.elements.question}</h3>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const slideEditor = currentSlide ? (
    <SlideEditor
      key={currentSlide.id}
      slide={currentSlide}
      onUpdate={updateSlide}
      onDelete={deleteSlide}
      onDuplicate={duplicateSlide}
      isActive={true}
      busy={busy}
    />
  ) : (
    <div className="text-center text-gray-500">No slide selected</div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                      className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                    >
                      {busy ? "Saving..." : <Save size={16} />}
                    </button>
                    <button
                      onClick={cancelTitleEdit}
                      disabled={busy}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900">{presentation.title}</h1>
                    <button
                      onClick={handleTitleEdit}
                      disabled={busy}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
                  disabled={busy}
                  className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
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
                disabled={busy}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <Settings size={16} />
                Settings
              </button>
              {/* Tabs for Editor and Present View */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab("editor")}
                  disabled={busy}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === "editor" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} disabled:opacity-50`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab("present")}
                  disabled={busy}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === "present" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} disabled:opacity-50`}
                >
                  Present
                </button>
              </div>
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
            {apiError && <div className="text-red-500 mb-4">Error: {apiError}</div>}
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
                    disabled={busy}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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
                    disabled={busy}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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
                  disabled={busy}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
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

      {apiError && <div className="p-4 text-red-500 bg-red-100 border border-red-200 rounded-md m-4">Error: {apiError}</div>}

      {activeTab === "editor" ? (
        <PowerPointLayout
          slideList={slideList}
          slideEditor={slideEditor}
          questionTypes={<QuestionTypes onAddSlide={addSlide} busy={busy} />}
        />
      ) : (
        <AdminPresentPage />
      )}
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
