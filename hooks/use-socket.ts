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
  onError?: (data: { message: string }) => void
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

export const useSocket = (handlers?: SocketEventHandlers) => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUserId()

    if (!socketRef.current) {
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      })

      socket.on('connect', () => {
        console.log('Socket connected', socket.id)
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id)
        setIsConnected(false)
      })

      socket.on('error', (data) => {
        console.error('Socket error:', data)
        handlers?.onError?.(data)
      })

      // Register all handlers
      for (const event in handlers) {
        if (Object.prototype.hasOwnProperty.call(handlers, event)) {
          const handler = (handlers as any)[event]
          if (typeof handler === 'function') {
            // Remove 'on' prefix and convert camelCase to kebab-case (e.g. onRoomJoined -> room-joined)
            const name = event.replace(/^on/, '')
            const eventName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
            socket.on(eventName, handler)
          }
        }
      }

      socketRef.current = socket
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [handlers, supabase])

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && isConnected) {
      console.log(`Emitting ${event}:`, data)
      socketRef.current.emit(event, data)
    } else {
      console.warn(`Socket not connected, cannot emit ${event}:`, data)
    }
  }, [isConnected])

  return { socket: socketRef.current, isConnected, emit, userId }
}