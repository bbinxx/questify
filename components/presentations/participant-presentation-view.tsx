import { useEffect, useState } from 'react'
import { Presentation, Slide } from '@/app/page'
import { useSocket } from '@/hooks/use-socket'
import { ResultChart } from './result-chart'

interface ParticipantPresentationViewProps {
  presentation: Presentation
  onLeave: () => void
}

export function ParticipantPresentationView({
  presentation,
  onLeave,
}: ParticipantPresentationViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(presentation.current_slide)
  const [showResults, setShowResults] = useState(false)
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null)
  const [responseValue, setResponseValue] = useState<string | string[]>('')
  const [votesData, setVotesData] = useState<any[] | null>(null)

  const { emit, userId } = useSocket({
    onSlideChanged: (data) => {
      console.log('Participant: Slide changed', data)
      setCurrentSlideIndex(data.slideIndex)
      setShowResults(false)
      setResponseValue('')
      setVotesData(null)
    },
    onPresenterControl: (data) => {
      console.log('Participant: Presenter control', data)
      if (data.showResults !== undefined) {
        setShowResults(data.showResults)
      }
      if (data.currentSlideIndex !== undefined) {
        setCurrentSlideIndex(data.currentSlideIndex)
        setShowResults(false)
        setResponseValue('')
        setVotesData(null)
      }
    },
    onVotesUpdated: (data) => {
      console.log('Participant: Votes updated', data)
      if (data.slideId === currentSlide?.id) {
        setVotesData(data.votes)
      }
    },
    onError: (data) => {
      console.error('Socket error:', data.message)
      alert(`Error: ${data.message}`)
    },
  })

  useEffect(() => {
    if (presentation.slides.length > 0) {
      setCurrentSlide(presentation.slides[currentSlideIndex])
    }
  }, [currentSlideIndex, presentation.slides])

  useEffect(() => {
    // Emit join-room when component mounts or presentation changes
    emit('join-room', {
      presentationId: presentation.id,
      roomCode: presentation.code,
      userId: userId,
      userRole: 'participant',
    })
  }, [emit, presentation.id, presentation.code, userId])

  const handleSubmitResponse = () => {
    if (!currentSlide || !responseValue) return

    emit('submit-response', {
      presentationId: presentation.id,
      slideId: currentSlide.id,
      response: { value: responseValue },
      userName: userId || 'Anonymous', // Use userId or a prompt for name
      slideType: currentSlide.type,
    })
    setResponseValue('') // Clear response after submission
  }

  if (!currentSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <p className="text-xl text-gray-700">Loading slide...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-800">{presentation.title}</h1>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              <span>
                Slide {currentSlideIndex + 1} of {presentation.slides.length}
              </span>
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Live</span>
            </div>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-xl">
            {showResults ? (
              <ResultChart slide={currentSlide} votesData={votesData} />
            ) : (
              <div className="space-y-8 text-center">
                <h2 className="text-3xl font-bold text-gray-800">{currentSlide.question}</h2>
                {currentSlide.type === 'multiple_choice' || currentSlide.type === 'single_choice' ? (
                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                    {currentSlide.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (currentSlide.type === 'single_choice') {
                            setResponseValue(option)
                          } else if (currentSlide.type === 'multiple_choice') {
                            setResponseValue((prev) => {
                              const prevArray = Array.isArray(prev) ? prev : []
                              if (prevArray.includes(option)) {
                                return prevArray.filter((item) => item !== option)
                              } else {
                                return [...prevArray, option]
                              }
                            })
                          }
                        }}
                        className={`transform rounded-lg p-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105
                          ${(Array.isArray(responseValue) && responseValue.includes(option)) || responseValue === option
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!responseValue || (Array.isArray(responseValue) && responseValue.length === 0)}
                      className="col-span-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Response
                    </button>
                  </div>
                ) : currentSlide.type === 'text' ? (
                  <div className="mx-auto max-w-2xl">
                    <textarea
                      className="w-full p-4 border-2 border-gray-300 rounded-lg resize-none"
                      placeholder="Enter your response..."
                      rows={4}
                      value={responseValue as string}
                      onChange={(e) => setResponseValue(e.target.value)}
                    />
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!responseValue}
                      className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Response
                    </button>
                  </div>
                ) : currentSlide.type === 'word_cloud' ? (
                  <div className="mx-auto max-w-2xl">
                    <input
                      type="text"
                      className="w-full p-4 border-2 border-gray-300 rounded-lg"
                      placeholder="Enter words separated by spaces..."
                      value={responseValue as string}
                      onChange={(e) => setResponseValue(e.target.value)}
                    />
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!responseValue}
                      className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
            <button onClick={onLeave} className="font-medium text-gray-600 hover:text-gray-800">
              ← Leave Presentation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
