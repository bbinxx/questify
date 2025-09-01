"use client"

import { useEffect, useState } from "react"
import { BarChart3, ChevronLeft, ChevronRight, Copy, Edit3, Plus, Trash2, Users, Settings, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { JoinForm } from "@/components/presentations/join-form"
import { SlideEditor, type SlideRecord, type SlideElements, type QuestionType } from "@/components/presentations/slide-editor"

type Slide = {
  id: number
  question: string
  type: QuestionType
  options: string[]
  responses: number[]
  settings: {
    allowMultiple?: boolean
    showResults?: boolean
    timeLimit?: number
    maxLength?: number
    required?: boolean
  }
}

type Presentation = {
  id: number
  title: string
  code: string
  created_at: string
  is_active: boolean
  current_slide: number
  slides: Slide[]
  settings?: {
    allowAnonymous?: boolean
    showResults?: boolean
    timeLimit?: number
  }
}

const mockData: { presentations: Presentation[] } = {
  presentations: [
    {
      id: 1,
      title: "Marketing Survey 2024",
      code: "MKT2024",
      created_at: "2024-01-15",
      is_active: false,
      current_slide: 0,
      slides: [
        {
          id: 1,
          question: "What is your preferred social media platform?",
          type: "multiple_choice",
          options: ["Instagram", "Twitter", "Facebook", "TikTok"],
          responses: [15, 8, 12, 25],
          settings: {
            allowMultiple: true,
            showResults: true
          }
        },
        {
          id: 2,
          question: "How would you describe our product?",
          type: "word_cloud",
          options: [],
          responses: [],
          settings: {
            showResults: true
          }
        },
        {
          id: 3,
          question: "What is your preferred development environment?",
          type: "single_choice",
          options: ["VS Code", "IntelliJ", "Sublime Text", "Vim", "Other"],
          responses: [12, 8, 5, 3, 2],
          settings: {
            showResults: true
          }
        },
        {
          id: 4,
          question: "Tell us about your biggest challenge in software development",
          type: "text",
          options: [],
          responses: [],
          settings: {
            maxLength: 500
          }
        },
        {
          id: 5,
          question: "Important Discussion Point",
          type: "question_only",
          options: [],
          responses: [],
          settings: {}
        }
      ],
      settings: {
        allowAnonymous: true,
        showResults: true,
        timeLimit: 60
      }
    },
    {
      id: 2,
      title: "Employee Feedback",
      code: "EMP2024",
      created_at: "2024-01-20",
      is_active: true,
      current_slide: 0,
      slides: [
        {
          id: 3,
          question: "Rate your job satisfaction",
          type: "single_choice",
          options: ["Excellent", "Good", "Fair", "Poor"],
          responses: [12, 18, 8, 2],
          settings: {
            showResults: true
          }
        },
      ],
      settings: {
        allowAnonymous: false,
        showResults: true
      }
    },
  ],
}

const createClient = () => ({
  from: (table: keyof typeof mockData) => ({
    select: () => ({ data: (mockData as any)[table] || [], error: null }),
    insert: (data: any) => ({
      select: () =>
        Promise.resolve({
          data: Array.isArray(data) ? data : [data],
          error: null,
        }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () =>
          Promise.resolve({
            data:
              (mockData as any)[table]?.map((item: any) => (item[column] === value ? { ...item, ...data } : item)) ||
              [],
            error: null,
          }),
      }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  }),
})

const supabase = createClient()

type View = "home" | "admin-list" | "admin" | "viewer"

function ResultChart({ slide }: { slide: Slide }) {
  const maxResponses = Math.max(...slide.responses)
  const totalResponses = slide.responses.reduce((a, b) => a + b, 0)

  if (slide.type === 'word_cloud') {
    return (
      <div className="space-y-6">
        <h2 className="mb-8 text-center text-2xl font-bold">{slide.question}</h2>
        <div className="text-center text-gray-500">
          <p>Word cloud visualization would appear here</p>
          <p className="text-sm">Words would grow and shrink based on frequency</p>
        </div>
      </div>
    )
  }

  if (slide.type === 'text' || slide.type === 'question_only') {
    return (
      <div className="space-y-6">
        <h2 className="mb-8 text-center text-2xl font-bold">{slide.question}</h2>
        <div className="text-center text-gray-500">
          <p>Text responses would be displayed here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="mb-8 text-center text-2xl font-bold">{slide.question}</h2>
      <div className="space-y-4">
        {slide.options.map((option, index) => {
          const responses = slide.responses[index]
          const percentage = totalResponses > 0 ? (responses / totalResponses) * 100 : 0
          return (
            <div key={index} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{option}</span>
                <span className="text-sm text-gray-600">
                  {responses} votes ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-gray-200">
                <div
                  className="h-4 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-center text-gray-600">Total Responses: {totalResponses}</div>
    </div>
  )
}

export default function Page() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [viewerPresentation, setViewerPresentation] = useState<Presentation | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Load presentations from the mock client
    const load = async () => {
      const { data } = supabase.from("presentations" as any).select()
      setPresentations((data as Presentation[]) || [])
    }
    load()
  }, [])

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

  const createPresentation = async () => {
    const newPresentation: Presentation = {
      id: Date.now(),
      title: "New Presentation",
      code: generateCode(),
      created_at: new Date().toISOString(),
      is_active: false,
      current_slide: 0,
      slides: [
        {
          id: Date.now(),
          question: "Sample Question?",
          type: "multiple_choice",
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          responses: [0, 0, 0, 0],
          settings: {
            allowMultiple: false,
            showResults: true
          }
        },
      ],
      settings: {
        allowAnonymous: true,
        showResults: true
      }
    }
    mockData.presentations.push(newPresentation)
    setPresentations([...mockData.presentations])
  }

  const joinPresentation = async () => {
    const presentation = mockData.presentations.find((p) => p.code === joinCode.trim().toUpperCase())
    if (presentation) {
      setViewerPresentation(presentation)
      setCurrentView("viewer")
      setCurrentSlideIndex(presentation.current_slide)
      setShowResults(false)
    }
  }

  const editPresentation = (presentation: Presentation) => {
    setSelectedPresentation(presentation)
    setCurrentView("admin")
    setCurrentSlideIndex(0)
    setShowResults(false)
  }

  const updateSlide = (slideIndex: number, updates: Partial<Slide>) => {
    if (!selectedPresentation) return
    const updated = { ...selectedPresentation }
    updated.slides[slideIndex] = { ...updated.slides[slideIndex], ...updates }
    setSelectedPresentation(updated)

    const idx = mockData.presentations.findIndex((p) => p.id === updated.id)
    if (idx !== -1) mockData.presentations[idx] = updated
  }

  const addSlide = () => {
    if (!selectedPresentation) return
    const updated = { ...selectedPresentation }
    const newSlide: Slide = {
      id: Date.now(),
      question: "New Question?",
      type: "multiple_choice",
      options: ["Option 1", "Option 2"],
      responses: [0, 0],
      settings: {
        allowMultiple: false,
        showResults: true
      }
    }
    updated.slides.push(newSlide)
    setSelectedPresentation(updated)

    const idx = mockData.presentations.findIndex((p) => p.id === updated.id)
    if (idx !== -1) mockData.presentations[idx] = updated
  }

  const deleteSlide = (slideIndex: number) => {
    if (!selectedPresentation) return
    const updated = { ...selectedPresentation }
    updated.slides.splice(slideIndex, 1)
    setSelectedPresentation(updated)

    const idx = mockData.presentations.findIndex((p) => p.id === updated.id)
    if (idx !== -1) mockData.presentations[idx] = updated

    if (currentSlideIndex >= updated.slides.length) {
      setCurrentSlideIndex(Math.max(0, updated.slides.length - 1))
    }
  }

  const duplicateSlide = (slideIndex: number) => {
    if (!selectedPresentation) return
    const updated = { ...selectedPresentation }
    const slideToDuplicate = updated.slides[slideIndex]
    const newSlide: Slide = {
      ...slideToDuplicate,
      id: Date.now(),
      question: `${slideToDuplicate.question} (Copy)`
    }
    updated.slides.push(newSlide)
    setSelectedPresentation(updated)

    const idx = mockData.presentations.findIndex((p) => p.id === updated.id)
    if (idx !== -1) mockData.presentations[idx] = updated
  }

  const moveSlide = (slideIndex: number, direction: 'up' | 'down') => {
    if (!selectedPresentation) return
    const updated = { ...selectedPresentation }
    const newIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1
    
    if (newIndex < 0 || newIndex >= updated.slides.length) return
    
    const [movedSlide] = updated.slides.splice(slideIndex, 1)
    updated.slides.splice(newIndex, 0, movedSlide)
    
    setSelectedPresentation(updated)

    const idx = mockData.presentations.findIndex((p) => p.id === updated.id)
    if (idx !== -1) mockData.presentations[idx] = updated
  }

  const nextSlide = () => {
    if (!selectedPresentation) return
    if (showResults) {
      if (currentSlideIndex < selectedPresentation.slides.length - 1) {
        setCurrentSlideIndex(currentSlideIndex + 1)
        setShowResults(false)
      }
    } else {
      setShowResults(true)
    }
  }

  const prevSlide = () => {
    if (!selectedPresentation) return
    if (currentSlideIndex > 0) {
      if (showResults) {
        setShowResults(false)
      } else {
        setCurrentSlideIndex(currentSlideIndex - 1)
        setShowResults(false)
      }
    }
  }

  const submitResponse = (optionIndex: number) => {
    if (!viewerPresentation || showResults) return
    const updated = { ...viewerPresentation }
    updated.slides[currentSlideIndex].responses[optionIndex]++
    setViewerPresentation(updated)

    const idx = mockData.presentations.findIndex((p) => p.id === updated.id)
    if (idx !== -1) mockData.presentations[idx] = updated
  }

  // Views
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-800">Questify - Interactive Presentations</h1>
            <p className="text-gray-600">Create and join interactive presentations with real-time audience engagement</p>
          </div>

          <JoinForm />

          <div className="mt-6 text-center">
            <Link href="/admin" className="font-medium text-blue-600 hover:text-blue-700">
              Admin Panel →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "admin-list") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <div className="space-x-4">
              <button
                onClick={createPresentation}
                className="flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
              >
                <Plus size={16} />
                New Presentation
              </button>
              <button onClick={() => setCurrentView("home")} className="text-gray-600 hover:text-gray-800">
                ← Back to Home
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presentations.map((presentation) => (
              <div key={presentation.id} className="rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-xl font-semibold">{presentation.title}</h3>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      presentation.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {presentation.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Copy size={16} />
                    <code className="rounded bg-gray-100 px-2 py-1">{presentation.code}</code>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BarChart3 size={16} />
                    <span>{presentation.slides.length} slides</span>
                  </div>
                </div>

                <button
                  onClick={() => editPresentation(presentation)}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-500 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  <Edit3 size={16} />
                  Edit Presentation
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "admin" && selectedPresentation) {
    const currentSlide = selectedPresentation.slides[currentSlideIndex]
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">{selectedPresentation.title}</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Code: <code className="rounded bg-gray-200 px-2 py-1">{selectedPresentation.code}</code>
              </span>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Settings size={16} />
                Settings
              </button>
              <button onClick={() => setCurrentView("admin-list")} className="text-gray-600 hover:text-gray-800">
                ← Back
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Presentation Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Anonymous Participation
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPresentation.settings?.allowAnonymous || false}
                      onChange={(e) => {
                        const updated = { ...selectedPresentation }
                        updated.settings = { ...updated.settings, allowAnonymous: e.target.checked }
                        setSelectedPresentation(updated)
                      }}
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
                      checked={selectedPresentation.settings?.showResults || false}
                      onChange={(e) => {
                        const updated = { ...selectedPresentation }
                        updated.settings = { ...updated.settings, showResults: e.target.checked }
                        setSelectedPresentation(updated)
                      }}
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
                    value={selectedPresentation.settings?.timeLimit || ''}
                    onChange={(e) => {
                      const updated = { ...selectedPresentation }
                      updated.settings = { ...updated.settings, timeLimit: parseInt(e.target.value) || undefined }
                      setSelectedPresentation(updated)
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="No limit"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Panel - Slide Editor */}
            <div>
              <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Slide Editor</h2>
                  <button
                    onClick={addSlide}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Slide
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {selectedPresentation.slides.length === 0 ? (
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
                    selectedPresentation.slides.map((slide, index) => (
                      <div key={slide.id} className="relative">
                        {/* Slide Controls */}
                        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                          {index > 0 && (
                            <button
                              onClick={() => moveSlide(index, 'up')}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Move up"
                            >
                              <ArrowUp size={14} />
                            </button>
                          )}
                          {index < selectedPresentation.slides.length - 1 && (
                            <button
                              onClick={() => moveSlide(index, 'down')}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Move down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          )}
                        </div>

                        <SlideEditor
                          slide={{
                            id: slide.id.toString(),
                            presentation_id: selectedPresentation.id.toString(),
                            position: index,
                            elements: {
                              question: slide.question,
                              type: slide.type,
                              options: slide.options,
                              settings: slide.settings
                            }
                          }}
                          onUpdate={async (slideId, updated) => {
                            const slideIndex = selectedPresentation.slides.findIndex(s => s.id.toString() === slideId)
                            if (slideIndex !== -1) {
                              updateSlide(slideIndex, {
                                question: updated.question,
                                type: updated.type,
                                options: updated.options,
                                settings: updated.settings
                              })
                            }
                          }}
                          onDelete={async (slideId) => {
                            const slideIndex = selectedPresentation.slides.findIndex(s => s.id.toString() === slideId)
                            if (slideIndex !== -1) {
                              deleteSlide(slideIndex)
                            }
                          }}
                          onDuplicate={async (slideId) => {
                            const slideIndex = selectedPresentation.slides.findIndex(s => s.id.toString() === slideId)
                            if (slideIndex !== -1) {
                              duplicateSlide(slideIndex)
                            }
                          }}
                          isActive={currentSlideIndex === index}
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
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Presentation Control</h2>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-600" />
                    <span className="text-gray-600">Live</span>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-center gap-4">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlideIndex === 0 && !showResults}
                    className="rounded-md bg-gray-500 p-2 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="rounded-md bg-gray-100 px-4 py-2">
                    Slide {currentSlideIndex + 1} of {selectedPresentation.slides.length}
                    {showResults ? " (Results)" : " (Question)"}
                  </span>

                  <button
                    onClick={nextSlide}
                    disabled={currentSlideIndex === selectedPresentation.slides.length - 1 && showResults}
                    className="rounded-md bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Next or Show Results"
                  >
                    {showResults ? <ChevronRight size={20} /> : <BarChart3 size={20} />}
                  </button>
                </div>

                <div className="min-h-96 rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
                  {showResults ? (
                    <ResultChart slide={currentSlide} />
                  ) : (
                    <div className="space-y-6 text-center">
                      <h2 className="text-2xl font-bold">{currentSlide.question}</h2>
                      {currentSlide.type === 'multiple_choice' || currentSlide.type === 'single_choice' ? (
                        <div className="grid grid-cols-1 gap-4">
                          {currentSlide.options.map((option, index) => (
                            <button
                              key={index}
                              className="rounded-lg border-2 border-gray-300 bg-white p-4 text-left hover:bg-gray-50"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : currentSlide.type === 'text' ? (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">Text response area</p>
                        </div>
                      ) : currentSlide.type === 'word_cloud' ? (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">Word cloud input area</p>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">Question only - no response needed</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "viewer" && viewerPresentation) {
    const currentSlide = viewerPresentation.slides[currentSlideIndex]
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-800">{viewerPresentation.title}</h1>
              <div className="flex items-center justify-center gap-4 text-gray-600">
                <span>
                  Slide {currentSlideIndex + 1} of {viewerPresentation.slides.length}
                </span>
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span>Live</span>
              </div>
            </div>

            <div className="rounded-lg bg-white p-8 shadow-xl">
              {showResults ? (
                <ResultChart slide={currentSlide} />
              ) : (
                <div className="space-y-8 text-center">
                  <h2 className="text-3xl font-bold text-gray-800">{currentSlide.question}</h2>
                  {currentSlide.type === 'multiple_choice' || currentSlide.type === 'single_choice' ? (
                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                      {currentSlide.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => submitResponse(index)}
                          className="transform rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-600"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : currentSlide.type === 'text' ? (
                    <div className="mx-auto max-w-2xl">
                      <textarea
                        className="w-full p-4 border-2 border-gray-300 rounded-lg resize-none"
                        placeholder="Enter your response..."
                        rows={4}
                      />
                      <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Submit Response
                      </button>
                    </div>
                  ) : currentSlide.type === 'word_cloud' ? (
                    <div className="mx-auto max-w-2xl">
                      <input
                        type="text"
                        className="w-full p-4 border-2 border-gray-300 rounded-lg"
                        placeholder="Enter words separated by spaces..."
                      />
                      <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Submit Words
                      </button>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-2xl">
                      <p className="text-gray-600">This is a discussion question. No response needed.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <button onClick={() => setCurrentView("home")} className="font-medium text-gray-600 hover:text-gray-800">
                ← Leave Presentation
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
