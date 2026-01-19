"use client"

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { 
  Send, 
  Users, 
  Eye, 
  EyeOff,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Cloud,
  HelpCircle,
  BarChart3,
  CheckSquare,
  Circle,
  Type
} from 'lucide-react'

interface ParticipantViewProps {
  presentationId: string
  roomCode: string
  userName?: string
  userId?: string
  currentSlide?: any
  onResponseSubmitted?: (response: any) => void
  debug?: boolean
}

export function ParticipantView({
  presentationId,
  roomCode,
  userName,
  userId,
  currentSlide,
  onResponseSubmitted,
  debug = false
}: ParticipantViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [response, setResponse] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const {
    socket,
    isConnected,
    isConnecting,
    error,
    room,
    participants,
    votes,
    connect,
    disconnect,
    joinRoom,
    submitResponse,
    getParticipants,
    sendActivity
  } = useSocket({
    presentationId,
    roomCode,
    userName,
    userRole: 'participant',
    userId,
    autoConnect: true,
    debug,
    eventHandlers: {
      onRoomJoined: (data) => {
        console.log('🎯 Participant joined room:', data)
        setCurrentSlideIndex(data.currentSlideIndex)
        setShowResults(data.showResults)
        setParticipantCount(data.participantCount)
        setHasSubmitted(false)
      },
      onParticipantJoined: (data) => {
        console.log('👤 Participant joined:', data)
        setParticipantCount(data.participantCount)
      },
      onParticipantLeft: (data) => {
        console.log('👤 Participant left:', data)
        setParticipantCount(data.participantCount)
      },
      onSlideChanged: (data) => {
        console.log('📄 Slide changed:', data)
        setCurrentSlideIndex(data.slideIndex)
        setHasSubmitted(false)
        setResponse('')
        setSelectedOptions([])
        setTimeLeft(null)
      },
      onPresenterControl: (data) => {
        console.log('🎮 Presenter control received:', data)
        if (data.currentSlideIndex !== undefined) {
          setCurrentSlideIndex(data.currentSlideIndex)
          setHasSubmitted(false)
          setResponse('')
          setSelectedOptions([])
        }
        if (data.showResults !== undefined) {
          setShowResults(data.showResults)
        }
      },
      onResponseSubmitted: (data) => {
        console.log('📝 Response submitted:', data)
      },
      onVotesUpdated: (data) => {
        console.log('🗳️ Votes updated:', data)
      },
      onError: (data) => {
        console.error('❌ Socket error:', data)
      },
      onConnect: () => {
        console.log('🔌 Connected to presentation server')
      },
      onDisconnect: () => {
        console.log('🔌 Disconnected from presentation server')
      }
    }
  })

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Handle text response submission
  const handleTextResponse = () => {
    if (!response.trim()) {
      alert('Please enter a response')
      return
    }

    console.log('📝 Submitting text response:', response)
    submitResponse({
      presentationId,
      slideId: currentSlide?.id || `slide-${currentSlideIndex}`,
      response: { type: 'text', value: response },
      userName,
      slideType: currentSlide?.type || 'text'
    })

    setHasSubmitted(true)
    onResponseSubmitted?.({ type: 'text', value: response })
    alert('Response submitted successfully!')
  }

  // Handle multiple choice response submission
  const handleMultipleChoiceResponse = () => {
    if (selectedOptions.length === 0) {
      alert('Please select at least one option')
      return
    }

    console.log('📝 Submitting multiple choice response:', selectedOptions)
    submitResponse({
      presentationId,
      slideId: currentSlide?.id || `slide-${currentSlideIndex}`,
      response: { type: 'multiple-choice', value: selectedOptions },
      userName,
      slideType: 'multiple-choice'
    })

    setHasSubmitted(true)
    onResponseSubmitted?.({ type: 'multiple-choice', value: selectedOptions })
    alert('Response submitted successfully!')
  }

  // Handle single choice response submission
  const handleSingleChoiceResponse = (value: string) => {
    console.log('📝 Submitting single choice response:', value)
    submitResponse({
      presentationId,
      slideId: currentSlide?.id || `slide-${currentSlideIndex}`,
      response: { type: 'single-choice', value },
      userName,
      slideType: 'single-choice'
    })

    setHasSubmitted(true)
    onResponseSubmitted?.({ type: 'single-choice', value })
    alert('Response submitted successfully!')
  }

  // Handle word cloud response submission
  const handleWordCloudResponse = () => {
    if (!response.trim()) {
      alert('Please enter some words')
      return
    }

    console.log('📝 Submitting word cloud response:', response)
    submitResponse({
      presentationId,
      slideId: currentSlide?.id || `slide-${currentSlideIndex}`,
      response: { type: 'word-cloud', value: response },
      userName,
      slideType: 'word-cloud'
    })

    setHasSubmitted(true)
    onResponseSubmitted?.({ type: 'word-cloud', value: response })
    alert('Words submitted successfully!')
  }

  // Handle checkbox change for multiple choice
  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, option])
    } else {
      setSelectedOptions(prev => prev.filter(o => o !== option))
    }
  }

  // Get participants list
  const handleGetParticipants = () => {
    console.log('📋 Getting participants list')
    getParticipants(presentationId)
  }

  // Render question type icon
  const renderQuestionTypeIcon = () => {
    const slideType = currentSlide?.type || 'text'
    
    switch (slideType) {
      case 'multiple_choice':
        return <CheckSquare className="h-6 w-6 text-blue-500" />
      case 'single_choice':
        return <Circle className="h-6 w-6 text-green-500" />
      case 'text':
        return <MessageSquare className="h-6 w-6 text-purple-500" />
      case 'word_cloud':
        return <Cloud className="h-6 w-6 text-orange-500" />
      case 'question_only':
        return <HelpCircle className="h-6 w-6 text-gray-500" />
      default:
        return <Type className="h-6 w-6 text-gray-500" />
    }
  }

  // Render response form based on slide type
  const renderResponseForm = () => {
    if (!currentSlide) {
      return (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Waiting for presenter to start...</p>
        </div>
      )
    }

    const slideType = currentSlide.type || 'text'

    switch (slideType) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                id="response"
                value={response}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                disabled={hasSubmitted}
                className="w-full rounded-lg border border-gray-300 p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                placeholder="Enter your response..."
                rows={4}
              />
            </div>
            <button
              onClick={handleTextResponse}
              disabled={hasSubmitted || !response.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2 inline" />
              Submit Response
            </button>
          </div>
        )

      case 'question_only':
        return (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">This is a question-only slide. No response needed.</p>
          </div>
        )

      case 'word_cloud':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="word-cloud" className="block text-sm font-medium text-gray-700 mb-2">
                Enter words (separated by spaces)
              </label>
              <textarea
                id="word-cloud"
                value={response}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                disabled={hasSubmitted}
                className="w-full rounded-lg border border-gray-300 p-4 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors resize-none"
                placeholder="Enter words like: amazing awesome fantastic..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter multiple words separated by spaces. Each word will be counted separately.
              </p>
            </div>
            <button
              onClick={handleWordCloudResponse}
              disabled={hasSubmitted || !response.trim()}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cloud className="h-4 w-4 mr-2 inline" />
              Submit Words
            </button>
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select all that apply:
              </label>
              <div className="space-y-3">
                {currentSlide.options?.map((option: string, index: number) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedOptions.includes(option)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleCheckboxChange(option, e.target.checked)
                      }
                      disabled={hasSubmitted}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleMultipleChoiceResponse}
              disabled={hasSubmitted || selectedOptions.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2 inline" />
              Submit Response
            </button>
          </div>
        )

      case 'single_choice':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select one option:
              </label>
              <div className="space-y-3">
                {currentSlide.options?.map((option: string, index: number) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedOptions[0] === option
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="single-choice"
                      value={option}
                      checked={selectedOptions[0] === option}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSelectedOptions([e.target.value])
                        handleSingleChoiceResponse(e.target.value)
                      }}
                      disabled={hasSubmitted}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">No response form available for this slide type.</p>
          </div>
        )
    }
  }

  // Render live vote visualization (if results are shown)
  const renderLiveVotes = () => {
    if (!showResults || !votes || votes.length === 0) {
      return null
    }

    const maxVotes = Math.max(...votes.map(v => v.count))

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Live Results
        </h4>
        <div className="space-y-3">
          {votes.map((vote, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900">{vote.option}</span>
                <span className="font-bold text-blue-600">{vote.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${maxVotes > 0 ? (vote.count / maxVotes) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{participantCount} participants</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Room:</span>
              <span className="font-mono text-sm font-medium text-gray-900">{roomCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentSlide ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Question Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
              <div className="flex items-center gap-3 mb-4">
                {renderQuestionTypeIcon()}
                <span className="text-sm font-medium opacity-90">
                  {currentSlide.type === 'multiple_choice' ? 'Multiple Choice' :
                   currentSlide.type === 'single_choice' ? 'Single Choice' :
                   currentSlide.type === 'text' ? 'Text Response' :
                   currentSlide.type === 'word_cloud' ? 'Word Cloud' :
                   currentSlide.type === 'question_only' ? 'Question Only' : 'Question'}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{currentSlide.question}</h1>
              {currentSlide.content && (
                <p className="text-blue-100 opacity-90">{currentSlide.content}</p>
              )}
            </div>

            {/* Response Area */}
            <div className="p-8">
              {hasSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Submitted!</h3>
                  <p className="text-gray-600">Thank you for your response.</p>
                </div>
              ) : (
                renderResponseForm()
              )}

              {/* Live Results */}
              {renderLiveVotes()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Waiting for presenter</h2>
            <p className="text-gray-600">The presentation will begin shortly...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
