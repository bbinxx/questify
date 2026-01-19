"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSocket } from '@/hooks/use-socket'
import { Presentation, Slide } from '@/app/page'
import { ResultChart } from '@/components/presentations/shared/result-chart'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'

export default function AdminPresentPage() {
  const params = useParams<{ id: string }>()
  const presentationId = params.id
  const supabase = createClient()

  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [votesData, setVotesData] = useState<any[] | null>(null)
  const [isStarted, setIsStarted] = useState(false)

  const { emit, userId } = useSocket({
    onRoomJoined: (data) => {
      console.log('Presenter: Room joined', data)
      setCurrentSlideIndex(data.currentSlideIndex)
    },
    onSlideChanged: (data) => {
      console.log('Presenter: Slide changed', data)
      setCurrentSlideIndex(data.slideIndex)
      setVotesData(null)
    },
    onPresenterControl: (data) => {
      console.log('Presenter: Presenter control', data)
      if (data.currentSlideIndex !== undefined) {
        setCurrentSlideIndex(data.currentSlideIndex)
        setVotesData(null)
      }
    },
    onVotesUpdated: (data) => {
      console.log('Presenter: Votes updated', data)
      if (data.slideId === presentation?.slides[currentSlideIndex]?.id) {
        setVotesData(data.votes)
      }
    },
    onError: (data) => {
      console.error('Socket error:', data.message)
      alert(`Error: ${data.message}`)
    },
  })

  useEffect(() => {
    const fetchPresentation = async () => {
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
      fetchPresentation()
    }
  }, [presentationId, supabase])

  useEffect(() => {
    if (presentation && userId) {
      emit('join-room', {
        presentationId: presentation.id,
        roomCode: presentation.code,
        userId: userId,
        userRole: 'presenter',
      })
    }
  }, [emit, presentation, userId])

  const handleStart = async () => {
    if (!presentation) return

    try {
      console.log('Starting presentation:', presentation.id);
      const res = await fetch(`/api/presentations/${presentation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: true,
          current_slide: currentSlideIndex
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      console.log('Presentation started successfully');
      setIsStarted(true);
      emit('presenter-control', {
        presentationId: presentation.id,
        action: 'start',
        slideIndex: currentSlideIndex,
      });
    } catch (err: any) {
      console.error('Failed to start presentation:', err);
      alert(`Failed to start presentation: ${err.message || 'Unknown error'}`);
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
      });
    } catch (err) {
      console.error('Failed to update slide in DB:', err);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><p className="text-sm sm:text-base">Loading presentation...</p></div>
  if (error) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-400 px-4"><p className="text-sm sm:text-base">Error: {error}</p></div>
  if (!presentation) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><p className="text-sm sm:text-base">No presentation found.</p></div>

  const currentSlide = presentation.slides[currentSlideIndex]

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
                {votesData?.length || 0}
              </span>
              <span className="ml-2">participants responded</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
