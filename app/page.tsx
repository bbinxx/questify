export const dynamic = "force-dynamic";
"use client"

import { useEffect, useState } from "react"
import { BarChart3, ChevronLeft, ChevronRight, Copy, Edit3, Plus, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { JoinForm } from "@/components/presentations/join-form"

type Slide = {
  id: number
  question: string
  type: "multiple_choice"
  options: string[]
  responses: number[]
}

type Presentation = {
  id: number
  title: string
  code: string
  created_at: string
  is_active: boolean
  current_slide: number
  slides: Slide[]
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
        },
        {
          id: 2,
          question: "How often do you shop online?",
          type: "multiple_choice",
          options: ["Daily", "Weekly", "Monthly", "Rarely"],
          responses: [5, 18, 22, 15],
        },
      ],
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
          type: "multiple_choice",
          options: ["Excellent", "Good", "Fair", "Poor"],
          responses: [12, 18, 8, 2],
        },
      ],
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

function SlideEditor({
  slide,
  slideIndex,
  onUpdate,
  onDelete,
}: {
  slide: Slide
  slideIndex: number
  onUpdate: (idx: number, updates: Partial<Slide>) => void
  onDelete: (idx: number) => void
}) {
  return (
    <div className="mb-4 rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold">Slide {slideIndex + 1}</h3>
        <button
          onClick={() => onDelete(slideIndex)}
          className="p-1 text-red-500 hover:text-red-700"
          aria-label="Delete slide"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Question</label>
        <input
          type="text"
          value={slide.question}
          onChange={(e) => onUpdate(slideIndex, { question: e.target.value })}
          className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your question..."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Options</label>
        {slide.options.map((option, optionIndex) => (
          <input
            key={optionIndex}
            type="text"
            value={option}
            onChange={(e) => {
              const newOptions = [...slide.options]
              newOptions[optionIndex] = e.target.value
              onUpdate(slideIndex, { options: newOptions })
            }}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder={`Option ${optionIndex + 1}`}
          />
        ))}
      </div>
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
        },
      ],
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
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      responses: [0, 0, 0, 0],
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
            <h1 className="mb-4 text-4xl font-bold text-gray-800">Question Presentations</h1>
            <p className="text-gray-600">Join a presentation or manage your own</p>
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
              <button onClick={() => setCurrentView("admin-list")} className="text-gray-600 hover:text-gray-800">
                ← Back
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Panel - Slide Editor */}
            <div>
              <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold">Slide Editor</h2>
                <div className="max-h-96 overflow-y-auto">
                  {selectedPresentation.slides.map((slide, index) => (
                    <SlideEditor
                      key={slide.id}
                      slide={slide}
                      slideIndex={index}
                      onUpdate={updateSlide}
                      onDelete={deleteSlide}
                    />
                  ))}
                </div>
                <button
                  onClick={addSlide}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-green-500 py-2 text-white transition-colors hover:bg-green-600"
                >
                  <Plus size={16} />
                  Add Slide
                </button>
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
                      <div className="grid grid-cols-2 gap-4">
                        {currentSlide.options.map((option, index) => (
                          <button
                            key={index}
                            className="rounded-lg border-2 border-gray-300 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
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
