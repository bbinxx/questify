"use client"

import useSWR from "swr"
import Link from "next/link"
import { Users } from "lucide-react"
import { useMemo, useState, useEffect, useCallback } from "react"
import { ResultChart } from "@/components/presentations/result-chart"
import { WordCloud } from "@/components/presentations/word-cloud"
import { usePresentationRealtime } from "@/hooks/use-presentation-realtime"
import { useParams } from "next/navigation"
import { useSocket } from "@/hooks/use-socket"

type Slide = {
  id: string
  position: number
  type: 'multiple_choice' | 'word_cloud' | 'question_only' | 'text' | 'single_choice' | 'scale' | 'ranking' | 'qa' | 'quiz' | 'guess_number'
  question: string
  options: string[]
  settings?: {
    minValue?: number
    maxValue?: number
  }
}

type Presentation = {
  id: string
  title: string
  code: string
  current_slide: number
  show_results: boolean
  is_active: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PresentationViewerPage() {
  const params = useParams<{ code: string }>()
  const code = params.code?.toUpperCase()

  const [participantCount, setParticipantCount] = useState(0)

  const { emit } = useSocket({
    onRoomJoined: (data) => {
      console.log('Client: Joined room', data)
      setParticipantCount(data.participantCount)
    },
    onParticipantJoined: (data) => {
      setParticipantCount(data.participantCount)
    },
    onParticipantLeft: (data) => {
      setParticipantCount(data.participantCount)
    }
  })

  const { data, mutate, error, isLoading } = useSWR<{ presentation: Presentation; slides: Slide[] }>(
    code ? `/api/presentations/by-code/${code}` : null,
    fetcher,
    {
      refreshInterval: 2000,
      revalidateOnFocus: true,
    }
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
    onControl: () => mutate(),
  })

  // Join socket room when presentation data is available
  useEffect(() => {
    if (presentation?.id && presentation?.code) {
      emit('join-room', {
        presentationId: presentation.id,
        roomCode: presentation.code,
        userRole: 'participant'
      })
    }
  }, [presentation?.id, presentation?.code, emit])

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [textInput, setTextInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    if (!presentation || !slide) return null
    return `vote:${presentation.id}:${slide.id}`
  }, [presentation, slide])

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      setSelectedIdx(saved != null ? Number(saved) : null)
    } catch (err) {
      console.error("Failed to load selection from local storage:", err);
    }
  }, [storageKey])

  const saveSelection = useCallback(
    (idx: number) => {
      if (!storageKey) return
      try {
        localStorage.setItem(storageKey, String(idx))
      } catch (err) {
        console.error("Failed to save selection to local storage:", err);
      }
      setSelectedIdx(idx)
    },
    [storageKey],
  )

  // Generate or retrieve a persistent session ID for the participant
  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return ''
    let id = localStorage.getItem('questify_participant_id')
    if (!id) {
      // Fallback or use crypto.randomUUID()
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('questify_participant_id', id)
    }
    return id
  }, [])

  const submitResponse = async (responsePayload: any) => {
    if (!presentation || !slide) return
    setBusy(true)
    setApiError(null);
    try {
      const userName = 'Anonymous'; // Placeholder for user name, could come from context/auth

      // Submit to socket server (primary real-time submission)
      emit('submit-response', {
        presentationId: presentation.id,
        slideId: slide.id,
        response: responsePayload,
        userName: userName || 'Anonymous',
        slideType: slide.type
      })

      // API call removed to use pure socket architecture
      /*
      const res = await fetch("/api/responses", {
        method: "POST",
        body: JSON.stringify({
          presentation_id: presentation.id,
          slide_id: slide.id,
          session_id: sessionId,
          response_data: responsePayload,
          user_name: userName || 'Anonymous'
        }),
      })
      if (!res.ok) {
        throw new Error(`Failed to submit response: ${res.statusText}`);
      }
      */
      mutate() // Rely on realtime to update results; local lock prevents further voting
    } catch (err) {
      console.error("Failed to submit response:", err);
      setApiError("Failed to submit response.");
    } finally {
      setBusy(false)
    }
  }

  const vote = async (optionIndex: number) => {
    if (selectedIdx !== null) return // Prevent re-voting
    saveSelection(optionIndex)
    await submitResponse({ option_index: optionIndex })
  }

  const submitText = async () => {
    if (!textInput.trim()) return;

    let payload: any = {};
    if (slide?.type === 'text' || slide?.type === 'question_only') {
      payload = { text: textInput.trim() };
    } else if (slide?.type === 'word_cloud') {
      payload = { words: textInput.trim() };
    } else if (slide?.type === 'guess_number') {
      payload = { guess: parseInt(textInput.trim()) };
    } else {
      console.error("Unsupported slide type for text submission:", slide?.type);
      setApiError("Unsupported slide type for submission.");
      return;
    }

    await submitResponse(payload);
    setTextInput("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p className="text-gray-700">Loading presentation...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="mx-auto max-w-xl text-center text-red-500">
          <p className="mb-4">Error loading presentation: {error.message}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    )
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

  // Debug logging
  console.log('Presentation data:', {
    is_active: presentation.is_active,
    current_slide: presentation.current_slide,
    code: presentation.code
  })

  // Show waiting screen if presentation hasn't started yet
  if (presentation.is_active === false || !presentation.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 rounded-lg bg-white p-6 sm:p-12 shadow-xl">
              <div className="mb-6">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-10 w-10 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{presentation.title}</h1>
                <p className="text-gray-600">Code: <span className="font-mono font-semibold text-blue-600">{presentation.code}</span></p>
              </div>

              <div className="py-8 border-y border-gray-200">
                <p className="text-xl text-gray-700 mb-2">Waiting for presenter to start...</p>
                <p className="text-gray-500">The presentation will begin shortly</p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-600">Connected</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-gray-500 text-sm">
                <Users size={14} /> {participantCount} joined
              </div>
            </div>

            <div className="mt-6">
              <Link href="/" className="font-medium text-gray-600 hover:text-gray-800">
                ← Leave Presentation
              </Link>
            </div>
          </div>
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
              <span className="ml-2 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-sm">
                <Users size={14} /> {participantCount}
              </span>
            </div>
          </div>

          {apiError && <div className="p-4 text-red-500 bg-red-100 border border-red-200 rounded-md m-4">Error: {apiError}</div>}

          <div className="rounded-lg bg-white p-8 shadow-xl">
            {slide ? (
              presentation.show_results ? (
                <ResultsBlock presentationId={presentation.id} slide={slide} />
              ) : (
                <div className="space-y-8 text-center">
                  <h2 className="text-3xl font-bold text-gray-800">{slide.question}</h2>
                  {slide.type === 'multiple_choice' || slide.type === 'single_choice' ? (
                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                      {slide.options.map((opt: string, i: number) => {
                        const isSelected = selectedIdx === i
                        const disabled = selectedIdx !== null || busy
                        return (
                          <button
                            key={i}
                            onClick={() => vote(i)}
                            disabled={disabled}
                            aria-pressed={isSelected}
                            className={`transform rounded-lg p-6 text-lg font-semibold shadow-lg transition-all
                              ${isSelected
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
                  ) : slide.type === 'text' ? (
                    <div className="mx-auto max-w-2xl space-y-4">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        disabled={busy}
                        className="w-full rounded-md border border-gray-300 p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none disabled:opacity-50"
                        rows={4}
                        placeholder="Enter your response..."
                      />
                      <button
                        onClick={submitText}
                        disabled={busy || !textInput.trim()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {busy ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  ) : slide.type === 'word_cloud' ? (
                    <div className="mx-auto max-w-2xl space-y-4">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        disabled={busy}
                        className="w-full rounded-md border border-gray-300 p-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none disabled:opacity-50"
                        rows={3}
                        placeholder="Enter words separated by spaces..."
                      />
                      <button
                        onClick={submitText}
                        disabled={busy || !textInput.trim()}
                        className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {busy ? "Submitting..." : "Submit Words"}
                      </button>
                    </div>
                  ) : slide.type === 'guess_number' ? (
                    <div className="mx-auto max-w-2xl space-y-4">
                      <input
                        type="number"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        disabled={busy}
                        className="w-full rounded-md border border-gray-300 p-4 text-center focus:border-pink-500 focus:ring-2 focus:ring-pink-200 disabled:opacity-50"
                        min={slide.settings?.minValue ?? 0}
                        max={slide.settings?.maxValue ?? 10}
                        placeholder="Enter your guess..."
                      />
                      <button
                        onClick={submitText}
                        disabled={busy || !textInput.trim()}
                        className="rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
                      >
                        {busy ? "Submitting..." : "Submit Guess"}
                      </button>
                    </div>
                  ) : slide.type === 'question_only' ? (
                    <div className="p-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p>This is a question-only slide. No response is needed.</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">Waiting for presenter...</div>
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
  const { data, error, isLoading } = useSWR<{ counts: number[]; cloud?: { text: string; value: number }[] }>(
    slide.type === 'word_cloud'
      ? `/api/responses?presentation_id=${presentationId}&slide_id=${slide.id}&type=word_cloud`
      : `/api/responses?presentation_id=${presentationId}&slide_id=${slide.id}&options=${slide.options?.length || 0}`,
    (u: string) => fetch(u).then((r) => r.json()),
  )

  if (isLoading) return <div className="text-center text-gray-500">Loading results...</div>
  if (error) return <div className="text-center text-red-500">Error loading results.</div>

  if (slide.type === 'word_cloud') {
    return <WordCloud words={data?.cloud ?? []} />
  }

  const votesData = (slide.options || []).map((opt, i) => ({
    option: opt,
    count: (data?.counts && data.counts[i]) || 0
  }))

  return (
    <ResultChart
      slide={slide as any}
      votesData={votesData}
    />
  )
}
