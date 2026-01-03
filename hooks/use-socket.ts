import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { createClient } from '@/lib/supabase/client'

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
    currentVotes?: Record<string, VoteData[]>
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
  onSaveComplete?: (data: { count: number }) => void
  onError?: (data: { message: string; error?: string }) => void
}

const getSocketUrl = () => {
  // If env var is set, use it
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL
  }

  // In browser, use current hostname with socket port
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const hostname = window.location.hostname
    const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || '3001'
    return `${protocol}//${hostname}:${socketPort}`
  }

  // Fallback for SSR
  return 'http://localhost:3001'
}

const SOCKET_URL = getSocketUrl()

// Singleton socket instance shared across all hook instances
let globalSocket: Socket | null = null
let connectionListenersCount = 0

export const useSocket = (handlers?: SocketEventHandlers) => {
  const handlersRef = useRef<SocketEventHandlers | undefined>(handlers)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const [isConnected, setIsConnected] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const supabase = createClient()
  const mountedRef = useRef(true)

  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    mountedRef.current = true
    connectionListenersCount++

    const getUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (mountedRef.current) {
          setUserId(user?.id)
        }
      } catch (err) {
        console.error('Failed to get user ID:', err)
      }
    }
    getUserId()

    // Create socket only if it doesn't exist
    if (!globalSocket) {
      console.log('🔌 Creating new socket connection to:', SOCKET_URL)

      globalSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 30000,
        autoConnect: true,
        forceNew: false,
      })

      globalSocket.on('connect', () => {
        console.log('✅ Socket connected:', globalSocket?.id)
        if (mountedRef.current) {
          setIsConnected(true)
          setConnectionError(null)
        }
      })

      globalSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        if (mountedRef.current) {
          setIsConnected(false)
        }

        // Don't attempt reconnection on intentional disconnects
        if (reason === 'io client disconnect' || reason === 'io server disconnect') {
          console.log('Intentional disconnect, not reconnecting')
        }
      })

      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        if (mountedRef.current) {
          setConnectionError(error.message)
          setIsConnected(false)
        }
      })

      globalSocket.on('error', (data) => {
        console.error('Socket error:', data)
        handlersRef.current?.onError?.(data)
      })

      // Register all known event types
      const setupHandler = (eventKey: string, eventName: string) => {
        globalSocket?.on(eventName, (data: any) => {
          console.log(`📨 Received ${eventName}:`, data)
          const handler = (handlersRef.current as any)?.[eventKey]
          if (typeof handler === 'function') {
            handler(data)
          }
        })
      }

      setupHandler('onRoomJoined', 'room-joined')
      setupHandler('onParticipantJoined', 'participant-joined')
      setupHandler('onParticipantLeft', 'participant-left')
      setupHandler('onSlideChanged', 'slide-changed')
      setupHandler('onResponseSubmitted', 'response-submitted')
      setupHandler('onPresenterControl', 'presenter-control')
      setupHandler('onParticipantsList', 'participants-list')
      setupHandler('onVotesUpdated', 'votes-updated')
      setupHandler('onSaveComplete', 'save-complete')
    } else {
      // Socket already exists, just update connection status
      if (mountedRef.current) {
        setIsConnected(globalSocket.connected)
      }
    }

    return () => {
      mountedRef.current = false
      connectionListenersCount--

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      // Only disconnect when all components using the socket have unmounted
      if (connectionListenersCount === 0 && globalSocket) {
        console.log('🔌 All components unmounted, disconnecting socket')
        globalSocket.disconnect()
        globalSocket = null
      }
    }
  }, [supabase])

  const emit = useCallback((event: string, data: any) => {
    if (!globalSocket) {
      console.error('⚠️ Socket not initialized, cannot emit', event)
      return
    }

    if (globalSocket.connected) {
      console.log(`📤 Emitting ${event}:`, data)
      globalSocket.emit(event, data)
    } else {
      console.warn(`⚠️ Socket disconnected, attempting to reconnect before emitting ${event}`)

      // Try to reconnect
      globalSocket.connect()

      // Wait for connection then emit
      const timeout = setTimeout(() => {
        if (globalSocket?.connected) {
          console.log(`✅ Reconnected! Now emitting ${event}:`, data)
          globalSocket.emit(event, data)
        } else {
          console.error(`❌ Failed to reconnect, cannot emit ${event}`)
          alert('Connection lost. Please refresh the page.')
        }
      }, 2000)

      // Cleanup timeout if connection happens sooner
      globalSocket.once('connect', () => {
        clearTimeout(timeout)
        console.log(`✅ Reconnected! Now emitting ${event}:`, data)
        globalSocket.emit(event, data)
      })
    }
  }, [connectionError])

  const reconnect = useCallback(() => {
    if (globalSocket && !globalSocket.connected) {
      console.log('Manually reconnecting socket...')
      globalSocket.connect()
    }
  }, [])

  return {
    socket: globalSocket,
    isConnected,
    emit,
    userId,
    connectionError,
    reconnect
  }
}