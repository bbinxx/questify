"use client"

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Users, 
  Eye, 
  EyeOff,
  Wifi,
  WifiOff,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Cloud,
  BarChart3,
  Settings,
  Bug
} from 'lucide-react'

interface RealtimePresentationProps {
  presentationId: string
  roomCode: string
  userName?: string
  userId?: string
  slides: any[]
  onSlideChange?: (slideIndex: number) => void
  debug?: boolean
}

export function RealtimePresentation({
  presentationId,
  roomCode,
  userName,
  userId,
  slides,
  onSlideChange,
  debug = false
}: RealtimePresentationProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showVotes, setShowVotes] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

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
    userRole: 'presenter',
    userId,
    autoConnect: true,
    debug,
    eventHandlers: {
      onRoomJoined: (data) => {
        console.log('🎯 Presenter joined room:', data)
        setCurrentSlideIndex(data.currentSlideIndex || 0)
        setParticipantCount(data.participantCount || 0)
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
        onSlideChange?.(data.slideIndex)
      },
      onPresenterControl: (data) => {
        console.log('🎮 Presenter control received:', data)
        if (data.currentSlideIndex !== undefined) {
          setCurrentSlideIndex(data.currentSlideIndex)
          onSlideChange?.(data.currentSlideIndex)
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

  // Join room on mount
  useEffect(() => {
    if (isConnected && presentationId && roomCode) {
      console.log('🎯 Joining presentation room:', { presentationId, roomCode })
      joinRoom(presentationId, roomCode)
    }
  }, [isConnected, presentationId, roomCode, joinRoom])

  // Handle slide navigation
  const goToSlide = (slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < slides.length) {
      console.log('📄 Going to slide:', slideIndex)
      setCurrentSlideIndex(slideIndex)
      onSlideChange?.(slideIndex)
      
      // Broadcast slide change to participants
      if (socket) {
        socket.emit('presenter-control', {
          presentationId,
          roomCode,
          currentSlideIndex: slideIndex,
          action: 'slide-change'
        })
      }
    }
  }

  // Handle play/pause
  const togglePlayPause = () => {
    console.log('⏯️ Toggle play/pause:', !isPlaying)
    setIsPlaying(!isPlaying)
    
    if (socket) {
      socket.emit('presenter-control', {
        presentationId,
        roomCode,
        action: isPlaying ? 'pause' : 'play'
      })
    }
  }

  // Handle show/hide results
  const toggleResults = () => {
    console.log('👁️ Toggle results visibility:', !showVotes)
    setShowVotes(!showVotes)
    
    if (socket) {
      socket.emit('presenter-control', {
        presentationId,
        roomCode,
        showResults: !showVotes,
        action: 'toggle-results'
      })
    }
  }

  // Get participants list
  const handleGetParticipants = () => {
    console.log('📋 Getting participants list')
    getParticipants(presentationId)
  }

  // Render vote visualization (bar chart)
  const renderVoteVisualization = () => {
    if (!votes || votes.length === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No votes yet</p>
        </div>
      )
    }

    const maxVotes = Math.max(...votes.map(v => v.count))

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Live Votes
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

  // Render word cloud visualization
  const renderWordCloud = () => {
    if (!votes || votes.length === 0) {
      return (
        <div className="text-center py-8">
          <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No words submitted yet</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Word Cloud
        </h4>
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-[200px]">
          {votes.map((vote, index) => {
            const fontSize = Math.max(12, Math.min(32, 12 + (vote.count * 2)))
            return (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full transition-all duration-300"
                style={{ fontSize: `${fontSize}px` }}
              >
                {vote.option} ({vote.count})
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  const currentSlide = slides[currentSlideIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{participantCount} participants</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">Slide {currentSlideIndex + 1} of {slides.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleResults}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  showVotes 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {showVotes ? <EyeOff size={16} /> : <Eye size={16} />}
                {showVotes ? 'Hide Results' : 'Show Results'}
              </button>
              
              <button
                onClick={handleGetParticipants}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Users size={16} />
                Participants
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Presentation Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Slide Content */}
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center p-8">
                {currentSlide ? (
                  <div className="text-center text-white">
                    <h1 className="text-4xl font-bold mb-4">{currentSlide.title}</h1>
                    {currentSlide.content && (
                      <p className="text-xl opacity-90">{currentSlide.content}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">No slides available</h1>
                    <p className="text-xl opacity-90">Add some slides to get started</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => goToSlide(currentSlideIndex - 1)}
                    disabled={currentSlideIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack size={16} />
                    Previous
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  
                  <button
                    onClick={() => goToSlide(currentSlideIndex + 1)}
                    disabled={currentSlideIndex === slides.length - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <SkipForward size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Votes */}
            {showVotes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {currentSlide?.type === 'word_cloud' ? renderWordCloud() : renderVoteVisualization()}
              </div>
            )}

            {/* Participants List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </h3>
              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-gray-500 text-sm">No participants yet</p>
                ) : (
                  participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{participant.user_name}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {participant.user_role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Debug Info */}
            {debug && (
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4" />
                  <span className="font-semibold">Debug Info</span>
                </div>
                <div className="space-y-1">
                  <div>Socket ID: {socket?.id || 'N/A'}</div>
                  <div>Room: {room || 'N/A'}</div>
                  <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                  <div>Votes: {votes.length}</div>
                  <div>Participants: {participants.length}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
