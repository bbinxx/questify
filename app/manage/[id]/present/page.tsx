"use client"

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSocket } from '@/hooks/use-socket'
import { Presentation, Slide } from '@/app/page'
import { ResultChart } from '@/components/presentations/shared/result-chart'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { ROUTES } from '@/lib/config/app-config'

export default function ManagePresentPage() {
  const params = useParams<{ id: string }>()
  const presentationId = params.id
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Per-slide data tracking
  const [slideDataMap, setSlideDataMap] = useState<Map<string, {
    votes: any[] | null,
    responseCount: number,
    textResponses: any[]
  }>>(new Map())

  const [isStarted, setIsStarted] = useState(false)
  const [liveParticipants, setLiveParticipants] = useState<number>(0)

  // Get current slide data
  const currentSlide = presentation?.slides[currentSlideIndex]
  const currentSlideData = currentSlide ? slideDataMap.get(currentSlide.id) : null
  const votesData = currentSlideData?.votes || null
  const responseCount = currentSlideData?.responseCount || 0
  const textResponses = currentSlideData?.textResponses || []

  // Helper to update slide data
  const updateSlideData = (slideId: string, updates: Partial<{
    votes: any[] | null,
    responseCount: number,
    textResponses: any[]
  }>) => {
    setSlideDataMap(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(slideId) || { votes: null, responseCount: 0, textResponses: [] }
      newMap.set(slideId, { ...existing, ...updates })
      return newMap
    })
  }

  const { emit, userId } = useSocket({
    onRoomJoined: (data) => {
      console.log('Presenter: Room joined', data)
      setCurrentSlideIndex(data.currentSlideIndex)
      setLiveParticipants(data.participantCount || 0)

      // Initialize votes from current state if available
      if (data.currentVotes) {
        Object.entries(data.currentVotes).forEach(([slideId, votes]: [string, any]) => {
          const totalResponses = Array.isArray(votes) ? votes.reduce((sum: number, v: any) => sum + v.count, 0) : 0
          updateSlideData(slideId, { votes, responseCount: totalResponses })
        })
      }
    },
    onParticipantJoined: (data) => {
      console.log('Presenter: Participant joined', data)
      setLiveParticipants(data.participantCount)
    },
    onParticipantLeft: (data) => {
      console.log('Presenter: Participant left', data)
      setLiveParticipants(data.participantCount)
    },
    onSlideChanged: (data) => {
      console.log('Presenter: Slide changed', data)
      setCurrentSlideIndex(data.slideIndex)
      // Don't reset data - keep it per slide
    },
    onPresenterControl: (data) => {
      console.log('Presenter: Presenter control', data)
      if (data.currentSlideIndex !== undefined) {
        setCurrentSlideIndex(data.currentSlideIndex)
        // Don't reset data
      }
    },
    onVotesUpdated: (data) => {
      console.log('Presenter: Votes updated', data)
      const totalResponses = data.votes.reduce((sum: number, v: any) => sum + v.count, 0)
      updateSlideData(data.slideId, {
        votes: data.votes,
        responseCount: totalResponses
      })
    },
    onResponseSubmitted: (data) => {
      console.log('Presenter: Response submitted', data)

      // Update text responses and increment count
      const existingData = slideDataMap.get(data.slideId) || { votes: null, responseCount: 0, textResponses: [] }
      updateSlideData(data.slideId, {
        textResponses: [...existingData.textResponses, {
          userName: data.userName,
          response: data.response,
          timestamp: data.timestamp
        }],
        responseCount: existingData.responseCount + 1
      })
    },
    onError: (data) => {
      console.error('Socket error:', data.message)
      alert(`Error: ${data.message}`)
    },
  })

  useEffect(() => {
    const ensureAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to access this page.')
        router.push(ROUTES.login)
        return
      }

      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('presentations')
        .select('*, slides(*)')
        .eq('id', presentationId)
        .limit(1)

      if (error) {
        console.error('Error fetching presentation:', error)
        setError(error.message)
      } else if (data && data.length > 0) {
        const presentationData = data[0] as any
        setPresentation({
          ...presentationData,
          slides: presentationData.slides || [],
          current_slide: presentationData.current_slide || 0,
        } as Presentation)
        setIsStarted(presentationData.is_active || false)
      }
      setLoading(false)
    }

    if (presentationId) {
      ensureAuthAndFetch()
    }
  }, [presentationId, supabase, router])

  useEffect(() => {
    console.log('📍 Present page join-room effect:', {
      hasPresentation: !!presentation,
      hasUserId: !!userId,
      presentationId: presentation?.id,
      roomCode: presentation?.code
    })

    if (presentation && userId) {
      console.log('🚀 Presenter joining room:', {
        presentationId: presentation.id,
        roomCode: presentation.code,
        userId,
        userRole: 'presenter'
      })

      emit('join-room', {
        presentationId: presentation.id,
        roomCode: presentation.code,
        userId: userId,
        userName: 'Presenter',
        userRole: 'presenter',
      })
    }
  }, [presentation, userId])

  const handleStart = async () => {
    if (!presentation) return

    try {
      const res = await fetch(`/api/presentations/${presentation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: true,
          current_slide: currentSlideIndex
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`)
      }

      setIsStarted(true)
      emit('presenter-control', {
        presentationId: presentation.id,
        action: 'start',
        slideIndex: currentSlideIndex,
      })
    } catch (err: any) {
      console.error('Failed to start presentation:', err)
      alert(`Failed to start presentation: ${err.message || 'Unknown error'}`)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1
      setCurrentSlideIndex(newIndex)
      updateSlideInDb(newIndex)
      emit('presenter-control', {
        presentationId: presentation!.id,
        action: 'prev-slide',
        slideIndex: newIndex,
      })
    }
  }

  const handleNextSlide = () => {
    if (presentation && currentSlideIndex < presentation.slides.length - 1) {
      const newIndex = currentSlideIndex + 1
      setCurrentSlideIndex(newIndex)
      updateSlideInDb(newIndex)
      emit('presenter-control', {
        presentationId: presentation.id,
        action: 'next-slide',
        slideIndex: newIndex,
      })
    }
  }

  const updateSlideInDb = async (slideIndex: number) => {
    if (!presentation) return
    try {
      await fetch(`/api/presentations/${presentation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_slide: slideIndex }),
      })
    } catch (err) {
      console.error('Failed to update slide in DB:', err)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><p className="text-sm sm:text-base">Loading presentation...</p></div>
  if (error) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-400 px-4"><p className="text-sm sm:text-base">Error: {error}</p></div>
  if (!presentation) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><p className="text-sm sm:text-base">No presentation found.</p></div>

  // currentSlide is already defined at top of component
  if (!currentSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white px-4">
        <p className="text-lg sm:text-xl">No slides in this presentation.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Top Control Bar */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white border-opacity-10 gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={() => window.history.back()}
            className="text-white hover:text-blue-400 font-medium transition-colors text-xs sm:text-sm"
          >
            ← Back
          </button>
          <div className="h-4 sm:h-6 w-px bg-white bg-opacity-20" />
          <span className="text-white font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
            {presentation.title}
          </span>
          <span className="text-gray-400 text-xs sm:text-sm">
            {presentation.code}
          </span>
          <div className="flex items-center gap-1 bg-green-600 bg-opacity-20 px-2 py-1 rounded-full border border-green-400 border-opacity-30">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-medium">{liveParticipants} Live</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-white text-xs sm:text-sm whitespace-nowrap">
            {currentSlideIndex + 1} / {presentation.slides.length}
          </span>

          {!isStarted && (
            <button
              onClick={handleStart}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all shadow-lg text-xs sm:text-sm"
            >
              <Play size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Start Presentation</span>
              <span className="sm:hidden">Start</span>
            </button>
          )}


          {isStarted && (
            <button
              onClick={async () => {
                try {
                  await fetch(`/api/presentations/${presentation.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_active: false }),
                  })

                  // Clear all slide data
                  setSlideDataMap(new Map())
                  setIsStarted(false)

                  // Broadcast end and clear data to all participants
                  emit('presenter-control', {
                    presentationId: presentation.id,
                    action: 'end-presentation',
                  })

                  emit('clear-presentation-data', {
                    presentationId: presentation.id,
                  })
                } catch (err) {
                  console.error('Failed to end presentation:', err)
                  alert('Failed to end presentation')
                }
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all shadow-lg text-xs sm:text-sm"
            >
              <span>End Presentation</span>
            </button>
          )}


          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="p-1.5 sm:p-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === presentation.slides.length - 1}
            className="p-1.5 sm:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Fullscreen Slide Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl">
          {/* Question Title */}
          <div className="mb-4 sm:mb-6 md:mb-8 text-center px-2">
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 break-words leading-tight">
              {currentSlide.question}
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg bg-black/30 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
              Join at <strong>{typeof window !== 'undefined' ? window.location.host : ''}/p/{presentation.code}</strong>
            </p>
          </div>

          {/* Results Chart - ALWAYS VISIBLE */}
          <div className="bg-white bg-opacity-95 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10">
            <ResultChart slide={currentSlide} votesData={votesData} />
          </div>

          {/* Response Count */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-white text-sm sm:text-base md:text-lg">
              <span className="font-semibold text-xl sm:text-2xl text-blue-300">
                {responseCount}
              </span>
              <span className="ml-2">participant{responseCount !== 1 ? 's' : ''} responded</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
