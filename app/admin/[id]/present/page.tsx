"use client"

import useSWR from "swr"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Users, BarChart3 } from "lucide-react"
import { ResultChart } from "@/components/presentations/result-chart"
import { WordCloud } from "@/components/presentations/word-cloud"
import { usePresentationRealtime } from "@/hooks/use-presentation-realtime"
import { useParams } from "next/navigation"
import { getBrowserSupabase } from "@/lib/supabase/client"
import { QuestionType, SlideElements } from "@/components/presentations/slide-editor"

type Slide = {
  id: string
  position: number
  elements: SlideElements
}
type Presentation = {
  id: string
  title: string
  code: string
  current_slide: number
  show_results: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PresentControlPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data, mutate, error, isLoading } = useSWR<{ presentation: Presentation; slides: Slide[] }>(
    id ? `/api/presentations/${id}` : null,
    fetcher,
  )

  const [busy, setBusy] = useState(false)
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
    setBusy(true)
    setApiError(null);
    try {
      const res = await fetch(`/api/presentations/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
      if (!res.ok) {
        throw new Error(`Failed to update presentation: ${res.statusText}`);
      }
      if (presentation) {
        const nextState = {
          current_slide: payload.current_slide ?? presentation.current_slide,
          show_results: payload.show_results ?? presentation.show_results,
        }
        broadcastControl(nextState)
      }
      mutate()
    } catch (err) {
      console.error("Failed to update presentation:", err);
      setApiError("Failed to update presentation.");
    } finally {
      setBusy(false)
    }
  }

  const goPrev = () => {
    if (!presentation) return
    if (presentation.show_results) {
      updatePresentation({ show_results: false })
    } else {
      updatePresentation({ current_slide: Math.max(0, presentation.current_slide - 1), show_results: false })
    }
  }

  const goNext = (totalSlides: number) => {
    if (!presentation) return
    if (presentation.show_results) {
      updatePresentation({
        current_slide: Math.min(totalSlides - 1, presentation.current_slide + 1),
        show_results: false,
      })
    } else {
      updatePresentation({ show_results: true })
    }
  }

  const toggleResults = () => {
    if (!presentation) return
    updatePresentation({ show_results: !presentation.show_results })
  }

  const jumpTo = (idx: number) => {
    if (!presentation) return
    updatePresentation({ current_slide: idx, show_results: false })
  }

  if (isLoading) return <div className="p-8">Loading presentation...</div>
  if (error) return <div className="p-8 text-red-500">Error loading presentation: {error.message}</div>

  if (!presentation) return <div className="p-8">No presentation found.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{presentation.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-gray-600">
              <span>
                Code: <code className="rounded bg-gray-200 px-2 py-1">{presentation.code}</code>
              </span>
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Live</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/p/${presentation.code}`}
              className="rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
            >
              Open attendee view
            </Link>
            <Link href={`/admin`} className="text-gray-600 hover:text-gray-800">
              ← Back
            </Link>
          </div>
        </div>

        {apiError && <div className="p-4 text-red-500 bg-red-100 border border-red-200 rounded-md m-4">Error: {apiError}</div>}

        {/* Controls */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Presentation Control</h2>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-600" />
              <span className="text-gray-600">Live</span>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={goPrev}
              disabled={busy || (presentation.current_slide === 0 && !presentation.show_results)}
              className="rounded-md bg-gray-500 px-3 py-2 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous"
            >
              <div className="flex items-center gap-2">
                <ChevronLeft size={18} />
                <span>Previous</span>
              </div>
            </button>

            <button
              onClick={toggleResults}
              disabled={busy}
              className={`rounded-md px-3 py-2 text-white transition-colors ${presentation.show_results ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-500 hover:bg-blue-600"} disabled:opacity-50`}
              aria-label="Toggle results"
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={18} />
                <span>{presentation.show_results ? "Hide Results" : "Show Results"}</span>
              </div>
            </button>

            <button
              onClick={() => goNext(slides.length)}
              disabled={busy || (presentation.current_slide === slides.length - 1 && presentation.show_results)}
              className="rounded-md bg-gray-700 px-3 py-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next"
            >
              <div className="flex items-center gap-2">
                <span>Next</span>
                <ChevronRight size={18} />
              </div>
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Jump to</label>
              <select
                value={presentation.current_slide}
                onChange={(e) => jumpTo(Number(e.target.value))}
                disabled={busy}
                className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-50"
              >
                {slides.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    Slide {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
            {currentSlide ? (
              presentation.show_results ? (
                <ResultsBlock presentationId={presentation.id} slide={currentSlide} />
              ) : (
                <div className="space-y-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-800">{currentSlide.elements.question}</h2>
                  {currentSlide.elements.type === 'multiple_choice' || currentSlide.elements.type === 'single_choice' ? (
                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                      {currentSlide.elements.options.map((opt, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-white p-4 text-lg font-medium text-gray-800 shadow-sm ring-1 ring-gray-200"
                        >
                          {opt}
                        </div>
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
                  ) : currentSlide.elements.type === 'guess_number' ? (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Guess number input area</p>
                    </div>
                  ) : currentSlide.elements.type === 'question_only' ? (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Question only - no response needed</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">Unsupported slide type</div>
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
  )
}

function ResultsBlock({ presentationId, slide }: { presentationId: string; slide: Slide }) {
  const { data, error, isLoading } = useSWR<{ counts: number[]; cloud?: { text: string; value: number }[] }>(
    slide.elements.type === 'word_cloud'
      ? `/api/responses?presentation_id=${presentationId}&slide_id=${slide.id}&type=word_cloud`
      : `/api/responses?presentation_id=${presentationId}&slide_id=${slide.id}&options=${slide.elements.options.length}`,
    (u) => fetch(u).then((r) => r.json()),
  )

  if (isLoading) return <div className="text-center text-gray-500">Loading results...</div>
  if (error) return <div className="text-center text-red-500">Error loading results.</div>

  if (slide.elements.type === 'word_cloud') {
    return <WordCloud words={data?.cloud ?? []} />
  }

  return (
    <ResultChart
      question={slide.elements.question}
      options={slide.elements.options}
      counts={data?.counts ?? Array(slide.elements.options.length).fill(0)}
    />
  )
}