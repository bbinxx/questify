"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { getBrowserSupabase } from '@/lib/supabase/client'

export interface SocketSession {
  id: string
  socketId: string
  userId?: string
  presentationId: string
  userName?: string
  userRole: 'presenter' | 'participant'
  isActive: boolean
}

export interface PresentationRoom {
  id: string
  presentationId: string
  roomCode: string
  isActive: boolean
  currentSlideIndex: number
  showResults: boolean
  presenterSocketId?: string
  participantCount: number
}

export interface VoteData {
  option: string
  count: number
}

export interface SocketEventHandlers {
  onRoomJoined?: (data: {
    roomCode: string
    presentationId: string
    currentSlideIndex: number
    showResults: boolean
    participantCount: number
  }) => void
  onParticipantJoined?: (data: {
    userName: string
    userRole: 'presenter' | 'participant'
    participantCount: number
  }) => void
  onParticipantLeft?: (data: {
    userName: string
    userRole: 'presenter' | 'participant'
    participantCount: number
  }) => void
  onSlideChanged?: (data: {
    slideIndex: number
    presentationId: string
  }) => void
  onResponseSubmitted?: (data: {
    slideId: string
    response: any
    userName: string
    timestamp: string
  }) => void
  onPresenterControl?: (data: {
    action: string
    presentationId: string
    currentSlideIndex?: number
    showResults?: boolean
    isActive?: boolean
  }) => void
  onParticipantsList?: (data: {
    participants: Array<{
      user_name: string
      user_role: 'presenter' | 'participant'
      joined_at: string
    }>
    presentationId: string
  }) => void
  onVotesUpdated?: (data: {
    slideId: string
    votes: VoteData[]
    slideType?: string
  }) => void
  onError?: (data: { message: string }) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export interface UseSocketOptions {
  presentationId?: string
  roomCode?: string
  userName?: string
  userRole?: 'presenter' | 'participant'
  userId?: string
  autoConnect?: boolean
  eventHandlers?: SocketEventHandlers
  debug?: boolean
}

// Debug logging function
function debugLog(message: string, data?: any, debug = false) {
  if (debug) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [SOCKET-DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  }
}

// Error logging function
function errorLog(message: string, error?: any) {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [SOCKET-ERROR] ${message}`, error)
}

export function useSocket({
  presentationId,
  roomCode,
  userName,
  userRole = 'participant',
  userId,
  autoConnect = true,
  eventHandlers = {},
  debug = false
}: UseSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<PresentationRoom | null>(null)
  const [participants, setParticipants] = useState<Array<{
    user_name: string
    user_role: 'presenter' | 'participant'
    joined_at: string
  }>>([])
  const [votes, setVotes] = useState<VoteData[]>([])
  
  const socketRef = useRef<Socket | null>(null)
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Initialize socket connection
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      debugLog('Socket already connected, skipping connection', null, debug)
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      debugLog('Starting socket connection...', { presentationId, roomCode, userRole }, debug)

      // Get the current user if not provided
      let currentUserId = userId
      let currentUserName = userName

      if (!currentUserId || !currentUserName) {
        debugLog('Getting user from Supabase auth...', null, debug)
        const supabase = getBrowserSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        currentUserId = user?.id
        currentUserName = user?.user_metadata?.full_name || user?.email || 'Anonymous'
        debugLog('User retrieved from auth', { currentUserId, currentUserName }, debug)
      }

      // Create socket connection
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
      debugLog('Creating socket connection to', socketUrl, debug)
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        timeout: 20000,
        forceNew: true,
        query: {
          presentationId,
          roomCode,
          userName: currentUserName,
          userRole,
          userId: currentUserId
        }
      })

      // Setup event listeners
      newSocket.on('connect', () => {
        debugLog('Socket connected successfully', { socketId: newSocket.id }, debug)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0
        eventHandlers.onConnect?.()
      })

      newSocket.on('disconnect', (reason) => {
        debugLog('Socket disconnected', { reason }, debug)
        setIsConnected(false)
        setIsConnecting(false)
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          debugLog('Server disconnected, attempting to reconnect...', null, debug)
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.connect()
            }
          }, 1000)
        }
        
        eventHandlers.onDisconnect?.()
      })

      newSocket.on('connect_error', (error) => {
        errorLog('Socket connection error', error)
        setError(`Connection failed: ${error.message}`)
        setIsConnecting(false)
        
        // Implement exponential backoff for reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000
          debugLog(`Reconnection attempt ${reconnectAttemptsRef.current + 1} in ${delay}ms`, null, debug)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            if (socketRef.current) {
              socketRef.current.connect()
            }
          }, delay)
        } else {
          setError('Failed to connect after multiple attempts')
        }
      })

      newSocket.on('error', (data) => {
        errorLog('Socket error received', data)
        setError(data.message)
        eventHandlers.onError?.(data)
      })

      newSocket.on('room-joined', (data) => {
        debugLog('Joined room successfully', data, debug)
        setRoom({
          id: data.roomCode,
          presentationId: data.presentationId,
          roomCode: data.roomCode,
          isActive: true,
          currentSlideIndex: data.currentSlideIndex,
          showResults: data.showResults,
          participantCount: data.participantCount
        })
        eventHandlers.onRoomJoined?.(data)
      })

      newSocket.on('participant-joined', (data) => {
        debugLog('Participant joined', data, debug)
        setParticipants(prev => [...prev, {
          user_name: data.userName,
          user_role: data.userRole,
          joined_at: new Date().toISOString()
        }])
        eventHandlers.onParticipantJoined?.(data)
      })

      newSocket.on('participant-left', (data) => {
        debugLog('Participant left', data, debug)
        setParticipants(prev => prev.filter(p => p.user_name !== data.userName))
        eventHandlers.onParticipantLeft?.(data)
      })

      newSocket.on('slide-changed', (data) => {
        debugLog('Slide changed', data, debug)
        setRoom(prev => prev ? { ...prev, currentSlideIndex: data.slideIndex } : null)
        setVotes([]) // Clear votes when slide changes
        eventHandlers.onSlideChanged?.(data)
      })

      newSocket.on('response-submitted', (data) => {
        debugLog('Response submitted', data, debug)
        eventHandlers.onResponseSubmitted?.(data)
      })

      newSocket.on('presenter-control', (data) => {
        debugLog('Presenter control received', data, debug)
        setRoom(prev => prev ? {
          ...prev,
          currentSlideIndex: data.currentSlideIndex ?? prev.currentSlideIndex,
          showResults: data.showResults ?? prev.showResults,
          isActive: data.isActive ?? prev.isActive
        } : null)
        eventHandlers.onPresenterControl?.(data)
      })

      newSocket.on('participants-list', (data) => {
        debugLog('Participants list received', data, debug)
        setParticipants(data.participants)
        eventHandlers.onParticipantsList?.(data)
      })

      newSocket.on('votes-updated', (data) => {
        debugLog('Votes updated', data, debug)
        setVotes(data.votes)
        eventHandlers.onVotesUpdated?.(data)
      })

      // Connect to socket
      newSocket.connect()

      // Join room if presentationId and roomCode are provided
      if (presentationId && roomCode) {
        debugLog('Joining room after connection', { presentationId, roomCode }, debug)
        newSocket.emit('join-room', {
          presentationId,
          roomCode,
          userName: currentUserName,
          userRole,
          userId: currentUserId
        })
      }

      socketRef.current = newSocket
      setSocket(newSocket)

    } catch (err) {
      errorLog('Error connecting to socket', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setIsConnecting(false)
    }
  }, [presentationId, roomCode, userName, userRole, userId, eventHandlers, debug])

  // Disconnect socket
  const disconnect = useCallback(() => {
    debugLog('Disconnecting socket...', null, debug)
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
      setError(null)
      reconnectAttemptsRef.current = 0
    }
  }, [debug])

  // Join room
  const joinRoom = useCallback((data: {
    presentationId: string
    roomCode: string
    userName?: string
    userRole?: 'presenter' | 'participant'
    userId?: string
  }) => {
    if (socketRef.current?.connected) {
      debugLog('Joining room', data, debug)
      socketRef.current.emit('join-room', data)
    } else {
      errorLog('Cannot join room: socket not connected')
    }
  }, [debug])

  // Submit response
  const submitResponse = useCallback((data: {
    presentationId: string
    slideId: string
    response: any
    userName?: string
    slideType?: string
  }) => {
    if (socketRef.current?.connected) {
      debugLog('Submitting response', data, debug)
      socketRef.current.emit('submit-response', data)
    } else {
      errorLog('Cannot submit response: socket not connected')
    }
  }, [debug])

  // Change slide (presenter only)
  const changeSlide = useCallback((data: {
    presentationId: string
    slideIndex: number
  }) => {
    if (socketRef.current?.connected) {
      debugLog('Changing slide', data, debug)
      socketRef.current.emit('slide-change', data)
    } else {
      errorLog('Cannot change slide: socket not connected')
    }
  }, [debug])

  // Presenter controls
  const presenterControl = useCallback((data: {
    presentationId: string
    action: 'next-slide' | 'prev-slide' | 'show-results' | 'hide-results' | 'start-presentation' | 'end-presentation'
    slideIndex?: number
  }) => {
    if (socketRef.current?.connected) {
      debugLog('Executing presenter control', data, debug)
      socketRef.current.emit('presenter-control', data)
    } else {
      errorLog('Cannot execute presenter control: socket not connected')
    }
  }, [debug])

  // Get participants list
  const getParticipants = useCallback((presentationId: string) => {
    if (socketRef.current?.connected) {
      debugLog('Getting participants list', { presentationId }, debug)
      socketRef.current.emit('get-participants', { presentationId })
    } else {
      errorLog('Cannot get participants: socket not connected')
    }
  }, [debug])

  // Send user activity
  const sendActivity = useCallback((presentationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user-activity', { presentationId })
    }
  }, [])

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && presentationId && roomCode) {
      debugLog('Auto-connecting to socket', { presentationId, roomCode }, debug)
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, presentationId, roomCode, connect, disconnect, debug])

  // Activity tracking effect
  useEffect(() => {
    if (isConnected && presentationId) {
      // Send activity every 30 seconds
      activityIntervalRef.current = setInterval(() => {
        sendActivity(presentationId)
      }, 30000)

      return () => {
        if (activityIntervalRef.current) {
          clearInterval(activityIntervalRef.current)
        }
      }
    }
  }, [isConnected, presentationId, sendActivity])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      disconnect()
    }
  }, [disconnect])

  return {
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
    changeSlide,
    presenterControl,
    getParticipants,
    sendActivity
  }
}
