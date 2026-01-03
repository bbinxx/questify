import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import cors from 'cors'
import { config } from 'dotenv'
import crypto from 'crypto'
import { createServiceRoleClient } from '../lib/supabase/service'
import { logger } from '../lib/logger'

// Load environment variables from .env.local
config({ path: '.env.local' })

// =======================
// EXPRESS APP SETUP
// =======================
const app = express()
const server = createServer(app)

app.use(express.json())

// =======================
// CORS CONFIG
// =======================
const CLIENT_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const IS_DEV = process.env.NODE_ENV !== 'production'

app.use(
  cors({
    origin: IS_DEV ? true : CLIENT_ORIGIN, // Allow all in dev, specific in prod
    credentials: true
  })
)

logger.info('Socket server initializing', {
  clientOrigin: CLIENT_ORIGIN,
  nodeEnv: process.env.NODE_ENV,
  socketPort: process.env.SOCKET_PORT || 3001
})

// =======================
// IN-MEMORY DATA STORES
// =======================
interface Session {
  id: string
  socketId: string
  userId?: string
  presentationId: string
  userName: string
  userRole: 'presenter' | 'participant'
  joinedAt: Date
}

interface Room {
  id: string
  presentation_id: string
  room_code: string
  participant_count: number
  current_slide_index: number
  show_results: boolean
  is_active: boolean
  presenter_socket_id?: string
  created_at: Date
  updated_at: Date
}

const rooms = new Map<string, Room>()
const sessions = new Map<string, Session>()
const votes = new Map<string, Map<string, Map<string, number>>>()
const roomResponses = new Map<string, any[]>()

logger.debug('In-memory stores initialized')

// =======================
// SOCKET.IO CONFIGURATION
// =======================
const isDevelopment = process.env.NODE_ENV !== 'production'

const io = new SocketIOServer(server, {
  cors: {
    origin: isDevelopment
      ? true // Allow all origins in development
      : CLIENT_ORIGIN, // Restrict to specific origin in production
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true
})

logger.socketInfo('Socket.IO server configured', {
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  corsOrigin: isDevelopment ? 'all (development)' : CLIENT_ORIGIN
})

// =======================
// HEALTH CHECK
// =======================
app.get('/health', (_req, res) => {
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeConnections: io.engine.clientsCount,
    activeRooms: rooms.size,
    activeSessions: sessions.size,
    uptime: process.uptime()
  }
  logger.debug('Health check requested', response)
  res.json(response)
})

// =======================
// DATABASE HELPERS
// =======================
async function getOrCreateRoom(presentationId: string, roomCode: string): Promise<Room> {
  logger.debug('getOrCreateRoom called', { presentationId, roomCode })

  const supabase = createServiceRoleClient() as any

  const { data, error } = await supabase
    .from('presentation_rooms')
    .select('*')
    .eq('presentation_id', presentationId)
    .maybeSingle()

  if (data && !error) {
    logger.debug('Room found in database', { roomData: data })
    return data
  }

  logger.debug('Creating new room', { presentationId, roomCode })

  const { data: newRoom, error: createError } = await supabase
    .from('presentation_rooms')
    .insert({
      presentation_id: presentationId,
      room_code: roomCode,
      participant_count: 0,
      current_slide_index: 0,
      show_results: false,
      is_active: true
    })
    .select()
    .single()

  if (createError) {
    logger.error('Failed to create room', createError)
    throw createError
  }

  logger.info('New room created', { roomCode, presentationId })
  return newRoom
}

async function getRoomByPresentationId(presentationId: string): Promise<Room | null> {
  const supabase = createServiceRoleClient() as any
  const { data, error } = await supabase
    .from('presentation_rooms')
    .select('*')
    .eq('presentation_id', presentationId)
    .maybeSingle()

  if (error) {
    logger.error('Failed to get room by presentation ID', error)
    return null
  }

  return data || null
}

async function updateRoom(roomId: string, updates: Partial<Room>) {
  const supabase = createServiceRoleClient() as any
  const { error } = await supabase
    .from('presentation_rooms')
    .update(updates)
    .eq('id', roomId)

  if (error) {
    logger.error('Failed to update room', error)
    throw error
  }

  logger.debug('Room updated', { roomId, updates })
}

async function saveSocketSession(session: Session) {
  const supabase = createServiceRoleClient() as any
  const { error } = await supabase.from('socket_sessions').insert({
    socket_id: session.socketId,
    user_id: session.userId,
    presentation_id: session.presentationId,
    user_name: session.userName,
    user_role: session.userRole,
    is_active: true
  })

  if (error) {
    logger.error('Failed to save socket session', error)
  }
}

async function deactivateSocketSession(socketId: string) {
  const supabase = createServiceRoleClient() as any
  await supabase
    .from('socket_sessions')
    .update({ is_active: false })
    .eq('socket_id', socketId)
}

// =======================
// SOCKET EVENT HANDLERS
// =======================
io.on('connection', (socket: Socket) => {
  logger.socketInfo('Client connected', {
    socketId: socket.id,
    transport: socket.conn.transport.name
  }, socket.id)

  logger.socketDebug('Connection details', {
    transport: socket.conn.transport.name,
    remoteAddress: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent']
  }, socket.id)

  // Error handler
  socket.on('error', (err) => {
    logger.socketError('Socket error occurred', err, socket.id)
  })

  // Join room handler
  socket.on('join-room', async (data) => {
    logger.socketEvent('join-room', 'Join room request received', data, socket.id, data?.userId)

    try {
      if (!data?.presentationId || !data?.roomCode) {
        throw new Error('Missing presentationId or roomCode')
      }

      const room = await getOrCreateRoom(data.presentationId, data.roomCode)
      logger.socketDebug('Room retrieved/created', { room }, socket.id, data.userId)

      await socket.join(room.room_code)
      logger.socketDebug('Socket joined room', { roomCode: room.room_code }, socket.id)

      const session: Session = {
        id: crypto.randomUUID(),
        socketId: socket.id,
        userId: data.userId,
        presentationId: data.presentationId,
        userName: data.userName || 'Anonymous',
        userRole: data.userRole || 'participant',
        joinedAt: new Date()
      }

      sessions.set(socket.id, session)
      rooms.set(room.room_code, room)

      if (!votes.has(room.room_code)) {
        votes.set(room.room_code, new Map())
      }
      if (!roomResponses.has(room.room_code)) {
        roomResponses.set(room.room_code, [])
      }

      logger.socketDebug('Session created', session, socket.id, data.userId)

      // Update participant count - only count actual participants (not presenters)
      if (session.userRole === 'participant') {
        // Count active participant sessions for this room
        const activeParticipants = Array.from(sessions.values()).filter(
          s => s.presentationId === room.presentation_id && s.userRole === 'participant'
        ).length

        room.participant_count = activeParticipants
        await updateRoom(room.id, { participant_count: activeParticipants })

        logger.socketInfo('Participant joined', {
          userName: session.userName,
          count: activeParticipants
        }, socket.id, data.userId)
      } else {
        // Presenter joined
        room.presenter_socket_id = socket.id
        await updateRoom(room.id, { presenter_socket_id: socket.id })
        logger.socketInfo('Presenter joined', {
          userName: session.userName
        }, socket.id, data.userId)
      }

      await saveSocketSession(session)

      // Get current votes
      const roomVotes = votes.get(room.room_code)
      const currentVotes: Record<string, any[]> = {}
      if (roomVotes) {
        roomVotes.forEach((slideVotes, slideId) => {
          currentVotes[slideId] = Array.from(slideVotes.entries()).map(([option, count]) => ({
            option,
            count
          }))
        })
      }

      const joinResponse = {
        roomCode: room.room_code,
        presentationId: data.presentationId,
        participantCount: room.participant_count,
        currentSlideIndex: room.current_slide_index,
        showResults: room.show_results,
        currentVotes
      }

      socket.emit('room-joined', joinResponse)
      logger.socketEvent('room-joined', 'Room joined response sent', joinResponse, socket.id, data.userId)

      const participantData = {
        userName: session.userName,
        userRole: session.userRole,
        participantCount: room.participant_count
      }
      socket.to(room.room_code).emit('participant-joined', participantData)
      logger.socketEvent('participant-joined', 'Participant joined broadcast', participantData, socket.id, data.userId)

    } catch (err) {
      logger.socketError('join-room failed', err, socket.id, data?.userId)
      socket.emit('error', { message: 'Join room failed', error: String(err) })
    }
  })

  // Slide change handler
  socket.on('slide-change', async ({ presentationId, slideIndex }) => {
    const session = sessions.get(socket.id)
    logger.socketEvent('slide-change', 'Slide change request', {
      presentationId,
      slideIndex
    }, socket.id, session?.userId)

    if (!session || session.userRole !== 'presenter') {
      logger.socketDebug('Slide change rejected - unauthorized', { session }, socket.id)
      return
    }

    try {
      const room = await getRoomByPresentationId(presentationId)
      if (!room) {
        logger.socketError('Slide change failed - room not found', { presentationId }, socket.id, session.userId)
        return
      }

      await updateRoom(room.id, { current_slide_index: slideIndex })
      logger.socketInfo('Slide updated', {
        slideIndex,
        roomCode: room.room_code
      }, socket.id, session.userId)

      const changeData = { slideIndex, presentationId }
      io.to(room.room_code).emit('slide-changed', changeData)
      logger.socketEvent('slide-changed', 'Slide change broadcast', changeData, socket.id, session.userId)
    } catch (err) {
      logger.socketError('slide-change error', err, socket.id, session?.userId)
    }
  })

  // Presenter control handler
  socket.on('presenter-control', async (data) => {
    const session = sessions.get(socket.id)
    logger.socketEvent('presenter-control', 'Presenter control request', data, socket.id, session?.userId)

    if (!session || session.userRole !== 'presenter') {
      logger.socketDebug('Presenter control rejected - unauthorized', { session }, socket.id)
      return
    }

    try {
      const room = await getRoomByPresentationId(data.presentationId)
      if (!room) {
        logger.socketError('Presenter control failed - room not found', {
          presentationId: data.presentationId
        }, socket.id, session.userId)
        return
      }

      const updates: any = {}

      switch (data.action) {
        case 'next-slide':
        case 'prev-slide':
          if (data.slideIndex !== undefined) {
            updates.current_slide_index = data.slideIndex
            room.current_slide_index = data.slideIndex
          }
          break
        case 'show-results':
          updates.show_results = true
          room.show_results = true
          break
        case 'hide-results':
          updates.show_results = false
          room.show_results = false
          break
        case 'start-presentation':
        case 'start':
          updates.is_active = true
          room.is_active = true
          break
        case 'end-presentation':
          updates.is_active = false
          room.is_active = false
          break
      }

      logger.socketDebug('Presenter control action processed', {
        action: data.action,
        updates
      }, socket.id, session.userId)

      if (Object.keys(updates).length > 0) {
        await updateRoom(room.id, updates)
      }

      const controlData = {
        action: data.action,
        ...updates,
        presentationId: data.presentationId,
        currentSlideIndex: room.current_slide_index
      }
      io.to(room.room_code).emit('presenter-control', controlData)
      logger.socketEvent('presenter-control', 'Presenter control broadcast', controlData, socket.id, session.userId)
    } catch (err) {
      logger.socketError('presenter-control error', err, socket.id, session?.userId)
    }
  })

  // Submit response handler
  socket.on('submit-response', async (data) => {
    const session = sessions.get(socket.id)
    const userName = data.userName || session?.userName || 'Anonymous'
    logger.socketEvent('submit-response', 'Response submission received', {
      slideId: data.slideId,
      slideType: data.slideType,
      userName
    }, socket.id, session?.userId)

    try {
      const room = await getRoomByPresentationId(data.presentationId)
      if (!room) {
        logger.socketError('Submit response failed - room not found', {
          presentationId: data.presentationId
        }, socket.id, session?.userId)
        return
      }

      const responseEntry = {
        presentation_id: data.presentationId,
        slide_id: data.slideId,
        response_data: data.response,
        user_name: userName,
        session_id: socket.id,
        user_id: session?.userId,
        created_at: new Date().toISOString()
      }

      const list = roomResponses.get(room.room_code) || []
      list.push(responseEntry)
      roomResponses.set(room.room_code, list)
      logger.socketDebug('Response stored', {
        responseCount: list.length
      }, socket.id, session?.userId)

      const roomVotes = votes.get(room.room_code) || new Map()
      const slideVotes = roomVotes.get(data.slideId) || new Map()

      const type = data.slideType?.replace(/-/g, '_')
      if (type === 'single_choice' || type === 'multiple_choice') {
        const values = Array.isArray(data.response.value)
          ? data.response.value
          : [data.response.value]

        values.forEach((v: string) =>
          slideVotes.set(v, (slideVotes.get(v) || 0) + 1)
        )
        logger.socketDebug('Vote recorded - choice', {
          type,
          values
        }, socket.id, session?.userId)
      } else if (type === 'word_cloud') {
        const words = data.response.value.split(/\s+/).filter((w: string) => w.length > 0)
        words.forEach((word: string) => {
          slideVotes.set(word, (slideVotes.get(word) || 0) + 1)
        })
        logger.socketDebug('Vote recorded - word cloud', {
          wordCount: words.length
        }, socket.id, session?.userId)
      }

      roomVotes.set(data.slideId, slideVotes)
      votes.set(room.room_code, roomVotes)

      const voteData = Array.from((slideVotes as Map<string, number>).entries()).map(([o, c]) => ({
        option: o,
        count: c
      }))

      const votesUpdate = {
        slideId: data.slideId,
        votes: voteData,
        slideType: data.slideType
      }
      io.to(room.room_code).emit('votes-updated', votesUpdate)
      logger.socketEvent('votes-updated', 'Votes updated broadcast', votesUpdate, socket.id, session?.userId)

      const responseData = {
        slideId: data.slideId,
        response: data.response,
        userName: userName,
        timestamp: new Date().toISOString()
      }
      io.to(room.room_code).emit('response-submitted', responseData)
      logger.socketEvent('response-submitted', 'Response submitted broadcast', responseData, socket.id, session?.userId)
    } catch (err) {
      logger.socketError('submit-response error', err, socket.id, session?.userId)
    }
  })

  // Save session data handler
  socket.on('save-session-data', async (data) => {
    const session = sessions.get(socket.id)
    logger.socketEvent('save-session-data', 'Save session data request', data, socket.id, session?.userId)

    try {
      const room = await getRoomByPresentationId(data.presentationId)
      if (!room) {
        logger.socketError('Save session failed - room not found', {
          presentationId: data.presentationId
        }, socket.id, session?.userId)
        return
      }

      const responses = roomResponses.get(room.room_code) || []
      if (responses.length === 0) {
        logger.socketInfo('No responses to save', {
          roomCode: room.room_code
        }, socket.id, session?.userId)
        socket.emit('save-complete', { count: 0 })
        return
      }

      const supabase = createServiceRoleClient() as any
      const { error } = await supabase.from('responses').insert(responses)

      if (error) {
        logger.socketError('Error saving responses to database', error, socket.id, session?.userId)
        socket.emit('error', { message: 'Failed to save data' })
        return
      }

      logger.socketInfo('Responses saved successfully', {
        count: responses.length
      }, socket.id, session?.userId)
      socket.emit('save-complete', { count: responses.length })
    } catch (err) {
      logger.socketError('save-session-data failed', err, socket.id, session?.userId)
      socket.emit('error', { message: 'Save failed' })
    }
  })

  // Clear presentation data handler
  socket.on('clear-presentation-data', async (data) => {
    const session = sessions.get(socket.id)
    logger.socketEvent('clear-presentation-data', 'Clear data request', data, socket.id, session?.userId)

    try {
      const { presentationId } = data

      if (!presentationId) {
        socket.emit('error', { message: 'Missing presentationId' })
        return
      }

      // Get the room for this presentation
      const room = await getRoomByPresentationId(presentationId)
      if (!room) {
        logger.socketWarn('No room found for presentation', { presentationId }, socket.id, session?.userId)
        return
      }

      // Clear votes for this room
      if (votes.has(room.room_code)) {
        votes.set(room.room_code, new Map())
        logger.socketDebug('Cleared votes for room', { roomCode: room.room_code }, socket.id, session?.userId)
      }

      // Clear text responses for this room
      if (roomResponses.has(room.room_code)) {
        roomResponses.set(room.room_code, [])
        logger.socketDebug('Cleared responses for room', { roomCode: room.room_code }, socket.id, session?.userId)
      }

      logger.socketInfo('Presentation data cleared', {
        presentationId,
        roomCode: room.room_code
      }, socket.id, session?.userId)

      // Notify all clients in this presentation's room to clear their local data
      io.to(room.room_code).emit('data-cleared', {
        presentationId
      })
    } catch (err) {
      logger.socketError('clear-presentation-data failed', err, socket.id, session?.userId)
      socket.emit('error', { message: 'Failed to clear data' })
    }
  })

  // Disconnect handler
  socket.on('disconnect', async (reason) => {
    const session = sessions.get(socket.id)
    logger.socketInfo('Client disconnected', {
      reason,
      session
    }, socket.id, session?.userId)

    if (!session) {
      logger.socketDebug('Disconnect - no session found', {}, socket.id)
      return
    }

    try {
      await deactivateSocketSession(socket.id)
      logger.socketDebug('Session marked inactive in DB', {}, socket.id, session.userId)

      // Remove session from memory first
      sessions.delete(socket.id)

      const room = await getRoomByPresentationId(session.presentationId)
      if (room && session.userRole === 'participant') {
        // Recalculate participant count from active sessions (not decrement)
        const activeParticipants = Array.from(sessions.values()).filter(
          s => s.presentationId === room.presentation_id && s.userRole === 'participant'
        ).length

        room.participant_count = activeParticipants
        await updateRoom(room.id, {
          participant_count: activeParticipants
        })

        logger.socketInfo('Participant count updated', {
          newCount: activeParticipants,
          roomCode: room.room_code
        }, socket.id, session.userId)

        const leftData = {
          userName: session.userName,
          userRole: session.userRole,
          participantCount: activeParticipants
        }
        socket.to(room.room_code).emit('participant-left', leftData)
        logger.socketEvent('participant-left', 'Participant left broadcast', leftData, socket.id, session.userId)
      }

      if (
        room &&
        room.participant_count === 0 &&
        !room.presenter_socket_id
      ) {
        rooms.delete(room.room_code)
        votes.delete(room.room_code)
        roomResponses.delete(room.room_code)
        logger.socketInfo('Empty room cleaned up', {
          roomCode: room.room_code
        }, socket.id, session.userId)
      }
    } catch (err) {
      logger.socketError('Error during disconnect cleanup', err, socket.id, session?.userId)
    }
  })
})

// =======================
// SERVER START
// =======================
const PORT = Number(process.env.SOCKET_PORT) || 3001

server.listen(PORT, '0.0.0.0', () => {
  logger.info('🚀 Socket.IO server running', {
    port: PORT,
    host: '0.0.0.0',
    healthUrl: `http://localhost:${PORT}/health`,
    environment: process.env.NODE_ENV || 'development'
  })
})

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`, error)
  } else {
    logger.error('Server error', error)
  }
  process.exit(1)
})

// =======================
// GRACEFUL SHUTDOWN
// =======================
let isShuttingDown = false

async function shutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`🛑 Received ${signal}, shutting down socket server`, {
    activeSessions: sessions.size,
    activeRooms: rooms.size,
    activeConnections: io.engine.clientsCount
  })

  // Close all socket connections
  io.close(() => {
    logger.info('All socket connections closed')
  })

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error)
  shutdown('uncaughtException')
})
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason)
})
