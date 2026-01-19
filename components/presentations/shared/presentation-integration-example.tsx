"use client"

import { useState, useEffect } from 'react'
import { RealtimePresentation } from '../presenter/realtime-presentation'
import { ParticipantView } from '../participant/participant-view'
import { useSocket } from '@/hooks/use-socket'
import {
  Users,
  Presentation,
  Monitor,
  Smartphone,
  Copy,
  Check,
  TrendingUp,
  Cloud,
  BarChart3,
  MessageSquare,
  HelpCircle,
  Settings,
  Bug
} from 'lucide-react'
import { toast } from 'sonner'

interface PresentationIntegrationExampleProps {
  presentationId: string
  roomCode: string
  isPresenter: boolean
  userName?: string
  userId?: string
  slides: any[]
  debug?: boolean
}

export function PresentationIntegrationExample({
  presentationId,
  roomCode,
  isPresenter,
  userName,
  userId,
  slides,
  debug = false
}: PresentationIntegrationExampleProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [isPresentationActive, setIsPresentationActive] = useState(false)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'presenter' | 'participant'>(
    isPresenter ? 'presenter' : 'participant'
  )
  const [showDebugInfo, setShowDebugInfo] = useState(debug)

  // Socket connection for real-time features
  const {
    isConnected,
    participants,
    room,
    votes,
    error: socketError
  } = useSocket({
    presentationId,
    roomCode,
    userName,
    userRole: isPresenter ? 'presenter' : 'participant',
    userId,
    autoConnect: true,
    debug,
    eventHandlers: {
      onRoomJoined: (data) => {
        console.log('🎯 Room joined in integration example:', data)
        setCurrentSlideIndex(data.currentSlideIndex)
        setShowResults(data.showResults)
        setIsPresentationActive(true)
      },
      onSlideChanged: (data) => {
        console.log('📄 Slide changed in integration example:', data)
        setCurrentSlideIndex(data.slideIndex)
      },
      onPresenterControl: (data) => {
        console.log('🎮 Presenter control in integration example:', data)
        if (data.currentSlideIndex !== undefined) {
          setCurrentSlideIndex(data.currentSlideIndex)
        }
        if (data.showResults !== undefined) {
          setShowResults(data.showResults)
        }
        if (data.isActive !== undefined) {
          setIsPresentationActive(data.isActive)
        }
      },
      onVotesUpdated: (data) => {
        console.log('🗳️ Votes updated in integration example:', data)
        if (isPresenter) {
          toast.info(`Live votes updated: ${data.votes.length} options`)
        }
      },
      onError: (data) => {
        console.error('❌ Socket error in integration example:', data)
        toast.error(`Socket error: ${data.message}`)
      }
    }
  })

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      toast.success('Room code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy room code')
    }
  }

  // Get current slide
  const currentSlide = slides[currentSlideIndex]

  // Render slide content based on type
  const renderSlideContent = () => {
    if (!currentSlide) {
      return (
        <div className="text-center text-muted-foreground">
          <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No slide content available</p>
        </div>
      )
    }

    const slideType = currentSlide.type || 'text'

    switch (slideType) {
      case 'text':
        return (
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
            {currentSlide.content && (
              <p className="text-muted-foreground mb-6">{currentSlide.content}</p>
            )}
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Text response slide
              </p>
            </div>
          </div>
        )

      case 'question-only':
        return (
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
            {currentSlide.content && (
              <p className="text-muted-foreground mb-6">{currentSlide.content}</p>
            )}
            <div className="p-4 border rounded-lg bg-muted/50">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Question-only slide - no response needed
              </p>
            </div>
          </div>
        )

      case 'word-cloud':
        return (
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
            {currentSlide.content && (
              <p className="text-muted-foreground mb-6">{currentSlide.content}</p>
            )}
            <div className="p-4 border rounded-lg bg-muted/50">
              <Cloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Word cloud slide - enter words separated by spaces
              </p>
            </div>
          </div>
        )

      case 'multiple-choice':
        return (
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
            {currentSlide.content && (
              <p className="text-muted-foreground mb-6">{currentSlide.content}</p>
            )}
            <div className="space-y-2">
              {currentSlide.options?.map((option: string, index: number) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg text-left hover:bg-muted/50 cursor-pointer"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )

      case 'single-choice':
        return (
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
            {currentSlide.content && (
              <p className="text-muted-foreground mb-6">{currentSlide.content}</p>
            )}
            <div className="space-y-2">
              {currentSlide.options?.map((option: string, index: number) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg text-left hover:bg-muted/50 cursor-pointer"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-muted-foreground">
            <p>Unknown slide type: {slideType}</p>
          </div>
        )
    }
  }

  // Render live vote visualization for presenter
  const renderLiveVoteVisualization = () => {
    if (!isPresenter || !votes || votes.length === 0) {
      return null
    }

    const maxVotes = Math.max(...votes.map(v => v.count))

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Live Vote Results
        </h3>

        {/* Bar Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vote Distribution
          </h4>
          {votes.map((vote, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{vote.option}</span>
                <span className="font-medium">{vote.count}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${maxVotes > 0 ? (vote.count / maxVotes) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Word Cloud */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Cloud className="h-4 w-4" />
            Word Cloud
          </h4>
          <div className="flex flex-wrap gap-2 justify-center p-4 border rounded-lg">
            {votes.map((vote, index) => {
              const fontSize = maxVotes > 0 ? Math.max(14, (vote.count / maxVotes) * 28 + 14) : 14
              return (
                <span
                  key={index}
                  className="inline-block px-3 py-1 rounded bg-primary/10 text-primary font-medium transition-all duration-300"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {vote.option} ({vote.count})
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with real-time status */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Presentation className="h-5 w-5" />
                <h1 className="text-lg font-semibold">Live Presentation</h1>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              {socketError && (
                <div className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                  Error: {socketError}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Room Code */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Room Code:</span>
                <div className="flex items-center gap-1">
                  <div className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {roomCode}
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="p-1 hover:bg-muted rounded"
                    title="Copy room code"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Participant Count */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {participants.length} participants
                </span>
              </div>

              {/* Debug Toggle */}
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className={`p-2 rounded ${showDebugInfo ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground'
                  }`}
                title="Toggle debug info"
              >
                <Bug className="h-4 w-4" />
              </button>

              {/* View Mode Toggle (for presenters) */}
              {isPresenter && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('presenter')}
                    className={`px-3 py-1 rounded text-sm ${viewMode === 'presenter'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    <Monitor className="h-4 w-4 mr-1 inline" />
                    Presenter
                  </button>
                  <button
                    onClick={() => setViewMode('participant')}
                    className={`px-3 py-1 rounded text-sm ${viewMode === 'participant'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    <Smartphone className="h-4 w-4 mr-1 inline" />
                    Participant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Presentation Area */}
          <div className="lg:col-span-3">
            <div className="bg-card border rounded-lg h-[600px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Slide {currentSlideIndex + 1} of {slides.length}
                </h2>
                <div className="flex items-center gap-2">
                  {showResults && (
                    <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Results Visible
                    </div>
                  )}
                  <div className="px-2 py-1 bg-muted rounded text-xs">
                    {currentSlide?.type || 'text'}
                  </div>
                </div>
              </div>

              <div className="h-full flex items-center justify-center">
                {renderSlideContent()}
              </div>
            </div>

            {/* Live Vote Visualization for Presenter */}
            {isPresenter && votes.length > 0 && (
              <div className="mt-6 bg-card border rounded-lg p-6">
                {renderLiveVoteVisualization()}
              </div>
            )}
          </div>

          {/* Real-time Controls Sidebar */}
          <div className="lg:col-span-1">
            {viewMode === 'presenter' ? (
              <RealtimePresentation
                presentationId={presentationId}
                roomCode={roomCode}
                userRole="presenter"
                userName={userName}
                userId={userId}
                onSlideChange={setCurrentSlideIndex}
                onShowResults={setShowResults}
                onPresentationStateChange={setIsPresentationActive}
                debug={debug}
              />
            ) : (
              <ParticipantView
                presentationId={presentationId}
                roomCode={roomCode}
                userName={userName}
                userId={userId}
                currentSlide={currentSlide}
                onResponseSubmitted={(response) => {
                  console.log('Response submitted:', response)
                }}
                debug={debug}
              />
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="mt-6 bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            Active Participants ({participants.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map((participant, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {participant.user_name}
                  </span>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${participant.user_role === 'presenter'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {participant.user_role}
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No participants yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        {showDebugInfo && (
          <div className="mt-6 bg-muted border rounded-lg p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5" />
              Debug Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Connection Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div>
                <strong>Current Slide:</strong> {currentSlideIndex + 1} / {slides.length}
              </div>
              <div>
                <strong>Show Results:</strong> {showResults ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Active Participants:</strong> {participants.length}
              </div>
              <div>
                <strong>Active Votes:</strong> {votes.length}
              </div>
              <div>
                <strong>Presentation Active:</strong> {isPresentationActive ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>User Role:</strong> {isPresenter ? 'Presenter' : 'Participant'}
              </div>
              <div>
                <strong>View Mode:</strong> {viewMode}
              </div>
              <div>
                <strong>Room Code:</strong> {roomCode}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Example usage in a page component:
/*
import { PresentationIntegrationExample } from '@/components/presentations/presentation-integration-example'

export default function PresentationPage({ params }: { params: { id: string } }) {
  const presentationId = params.id
  const roomCode = "ABC123" // Generate or get from presentation
  const isPresenter = true // Determine based on user role
  const userName = "John Doe" // Get from auth
  const userId = "user-id" // Get from auth
  
  const slides = [
    {
      id: "slide-1",
      title: "Welcome to the Presentation",
      content: "This is the first slide of our presentation.",
      type: "text"
    },
    {
      id: "slide-2",
      title: "What's your favorite color?",
      content: "Please select your favorite color from the options below.",
      type: "single-choice",
      options: ["Red", "Blue", "Green", "Yellow"]
    },
    {
      id: "slide-3",
      title: "Select all that apply",
      content: "Which programming languages do you know?",
      type: "multiple-choice",
      options: ["JavaScript", "Python", "Java", "C++", "TypeScript"]
    },
    {
      id: "slide-4",
      title: "Describe your experience",
      content: "Enter words that describe your experience with this presentation.",
      type: "word-cloud"
    },
    {
      id: "slide-5",
      title: "Important Question",
      content: "This is a question-only slide for discussion.",
      type: "question-only"
    }
  ]

  return (
    <PresentationIntegrationExample
      presentationId={presentationId}
      roomCode={roomCode}
      isPresenter={isPresenter}
      userName={userName}
      userId={userId}
      slides={slides}
      debug={process.env.NODE_ENV === 'development'}
    />
  )
}
*/
