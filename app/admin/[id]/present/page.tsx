"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSocket } from '@/hooks/use-socket'
import { Presentation, Slide } from '@/app/page'
import { ResultChart } from '@/components/presentations/result-chart'

export default function AdminPresentPage() {
  const params = useParams<{ id: string }>()
  const presentationId = params.id
  const supabase = createClient()

  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [votesData, setVotesData] = useState<any[] | null>(null)

  const { emit, userId } = useSocket({
    onRoomJoined: (data) => {
      console.log('Presenter: Room joined', data)
      setCurrentSlideIndex(data.currentSlideIndex)
      setShowResults(data.showResults)
    },
    onSlideChanged: (data) => {
      console.log('Presenter: Slide changed', data)
      setCurrentSlideIndex(data.slideIndex)
      setShowResults(false)
      setVotesData(null)
    },
    onPresenterControl: (data) => {
      console.log('Presenter: Presenter control', data)
      if (data.showResults !== undefined) {
        setShowResults(data.showResults)
      }
      if (data.currentSlideIndex !== undefined) {
        setCurrentSlideIndex(data.currentSlideIndex)
        setShowResults(false)
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
        .single()

      if (error) {
        console.error('Error fetching presentation:', error)
        setError(error.message)
      } else if (data) {
        setPresentation({
          ...data,
          slides: data.slides || [],
          current_slide_index: data.current_slide_index || 0,
        } as Presentation)
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

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><p>Loading presentation...</p></div>
  if (error) return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-red-500"><p>Error: {error}</p></div>
  if (!presentation) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><p>No presentation found.</p></div>

  const currentSlide = presentation.slides[currentSlideIndex]

  if (!currentSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">No slides in this presentation.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="w-full max-w-6xl rounded-lg bg-white p-12 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800">{presentation.title}</h1>
          <p className="text-xl text-gray-600">Slide {currentSlideIndex + 1} of {presentation.slides.length}</p>
        </div>

        {showResults ? (
          <ResultChart slide={currentSlide} votesData={votesData} />
        ) : (
          <div className="space-y-8 text-center">
            <h2 className="text-5xl font-bold text-gray-800 leading-tight">{currentSlide.question}</h2>
            {(currentSlide.type === 'multiple_choice' || currentSlide.type === 'single_choice') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {currentSlide.options.map((option, index) => (
                  <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md flex items-center justify-center text-2xl font-semibold text-gray-700">
                    {option}
                  </div>
                ))}
              </div>
            )}
            {currentSlide.type === 'text' && (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-xl">
                Audience responses will appear here.
              </div>
            )}
            {currentSlide.type === 'word_cloud' && (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-xl">
                Audience words will form a word cloud here.
              </div>
            )}
            {currentSlide.type === 'question_only' && (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-xl">
                This is a discussion slide. No audience response is collected.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
