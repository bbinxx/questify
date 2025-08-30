"use client"

import useSWR from "swr"
import Link from "next/link"
import { useMemo, useState, useEffect, useCallback } from "react"
import { ResultChart } from "@/components/presentations/result-chart"
import { usePresentationRealtime } from "@/hooks/use-presentation-realtime"
import { useParams } from "next/navigation"

type Slide = {
  id: string
  position: number
  elements: { question: string; options: string[] }
}
type Presentation = {
  id: string
  title: string
  code: string
  current_slide: number
  show_results: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PresentationViewerPage() {
  const params = useParams<{ code: string }>()
  const code = params.code?.toUpperCase()

  const { data, mutate } = useSWR<{ presentation: Presentation; slides: Slide[] }>(
    code ? `/api/presentations/by-code/${code}` : null,
    fetcher,
  )

  const presentation = data?.presentation
  const slides = useMemo(() => (data?.slides ?? []).sort((a, b) => a.position - b.position), [data?.slides])
  const slide = presentation && slides[presentation.current_slide]

  usePresentationRealtime({
    presentationId: presentation?.id || "",
    slideId: slide?.id,
    onPresentationUpdate: () => mutate(),
    onResponse: () => mutate(),
    onSlideChange: () => mutate(),
    onControl: () => mutate(), // listen to control broadcast via onControl to ensure instant updates even if Postgres Changes aren't enabled
  })

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const storageKey = useMemo(() => {
    if (!presentation || !slide) return null
    return `vote:${presentation.id}:${slide.id}`
  }, [presentation, slide])

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      setSelectedIdx(saved != null ? Number(saved) : null)
    } catch {}
  }, [storageKey])

  const saveSelection = useCallback(
    (idx: number) => {
      if (!storageKey) return
      try {
        localStorage.setItem(storageKey, String(idx))
      } catch {}
      setSelectedIdx(idx)
    },
    [storageKey],
  )

  const vote = async (optionIndex: number) => {
    if (!presentation || !slide) return
    if (selectedIdx !== null) return
    saveSelection(optionIndex)
    await fetch("/api/responses", {
      method: "POST",
      body: JSON.stringify({ presentation_id: presentation.id, slide_id: slide.id, option_index: optionIndex }),
    })
    // rely on realtime to update results; local lock prevents further voting
  }

  if (!presentation) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-gray-700">No presentation found for code {code}.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-800">{presentation.title}</h1>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              <span>
                Slide {presentation.current_slide + 1} of {slides.length}
              </span>
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Live</span>
            </div>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-xl">
            {slide ? (
              presentation.show_results ? (
                <ResultsBlock presentationId={presentation.id} slide={slide} />
              ) : (
                <div className="space-y-8 text-center">
                  <h2 className="text-3xl font-bold text-gray-800">{slide.elements.question}</h2>
                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                    {slide.elements.options.map((opt, i) => {
                      const isSelected = selectedIdx === i
                      const disabled = selectedIdx !== null || presentation.show_results
                      return (
                        <button
                          key={i}
                          onClick={() => vote(i)}
                          disabled={disabled}
                          aria-pressed={isSelected}
                          className={`transform rounded-lg p-6 text-lg font-semibold shadow-lg transition-all
                            ${
                              isSelected
                                ? "bg-green-600 text-white ring-2 ring-green-300 hover:scale-100"
                                : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105 hover:from-blue-600 hover:to-indigo-600"
                            }
                            ${disabled && !isSelected ? "opacity-60 cursor-not-allowed hover:scale-100" : ""}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {selectedIdx !== null && (
                    <p className="text-sm text-gray-600">You selected: {slide.elements.options[selectedIdx]}</p>
                  )}
                </div>
              )
            ) : (
              <div className="text-center text-gray-500">Waiting for slides…</div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="font-medium text-gray-600 hover:text-gray-800">
              ← Leave Presentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsBlock({ presentationId, slide }: { presentationId: string; slide: Slide }) {
  const { data } = useSWR<{ counts: number[] }>(
    `/api/responses?presentation_id=${presentationId}&slide_id=${slide.id}&options=${slide.elements.options.length}`,
    (u) => fetch(u).then((r) => r.json()),
  )
  return (
    <ResultChart
      question={slide.elements.question}
      options={slide.elements.options}
      counts={data?.counts ?? Array(slide.elements.options.length).fill(0)}
    />
  )
}
