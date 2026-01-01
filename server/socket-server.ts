import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import { config } from 'dotenv'
import { getServerSupabase } from '../lib/supabase/server'

// Load environment variables
config()

const app = express()
const server = createServer(app)

// CORS configuration
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  credentials: true
}))

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  console.log('Health check requested')
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeConnections: io.engine.clientsCount,
    activeRooms: Object.keys(rooms).length
  })
})

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})

// Room and session management
const rooms = new Map<string, any>()
const sessions = new Map<string, any>()
const votes = new Map<string, Map<string, Map<string, number>>>() // Store real-time votes for each slide

// Debug logging function
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

// Error logging function
function errorLog(message: string, error?: any) {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [ERROR] ${message}`, error ? error.stack || error : '')
}

// Socket.IO event handlers
io.on('connection', async (socket) => {
  debugLog(`Client connected: ${socket.id}`)

  // Handle room join
  socket.on('join-room', async (data: {
    presentationId: string
    roomCode: string
    userName?: string
    userRole?: 'presenter' | 'participant'
    userId?: string
  }) => {
    try {
      debugLog('Join room request', { socketId: socket.id, ...data })
      
      const supabase = await getServerSupabase()
      
      // Get or create room
      let room = await getOrCreateRoom(data.presentationId, data.roomCode)
      
      // Join socket room
      socket.join(room.roomCode)
      
      // Create session
      const session = {
        id: crypto.randomUUID(),
        socketId: socket.id,
        userId: data.userId,
        presentationId: data.presentationId,
        userName: data.userName || 'Anonymous',
        userRole: data.userRole || 'participant',
        isActive: true
      }

      // Save session to database
      const { error: sessionError } = await supabase
        .from('socket_sessions')
        .insert({
          socket_id: socket.id,
          user_id: data.userId,
          presentation_id: data.presentationId,
          user_name: session.userName,
          user_role: session.userRole,
          is_active: true
        })

      if (sessionError) {
        errorLog('Error saving session to database', sessionError)
        socket.emit('error', { message: 'Failed to save session' })
        return
      }

      // Update room participant count
      if (session.userRole === 'participant') {
        room.participantCount++
        await updateRoomParticipantCount(room.id, room.participantCount)
      } else if (session.userRole === 'presenter') {
        room.presenterSocketId = socket.id
        await updateRoomPresenter(room.id, socket.id)
      }

      // Store session locally
      sessions.set(socket.id, session)
      rooms.set(room.roomCode, room)

      // Initialize votes for this room if not exists
      if (!votes.has(room.roomCode)) {
        votes.set(room.roomCode, new Map())
      }

      // Emit join confirmation
      socket.emit('room-joined', {
        roomCode: room.roomCode,
        presentationId: data.presentationId,
        currentSlideIndex: room.currentSlideIndex,
        showResults: room.showResults,
        participantCount: room.participantCount
      })

      // Broadcast new participant to room
      socket.to(room.roomCode).emit('participant-joined', {
        userName: session.userName,
        userRole: session.userRole,
        participantCount: room.participantCount
      })

      // Log event
      await logEvent(socket.id, data.presentationId, 'join-room', {
        userName: session.userName,
        userRole: session.userRole
      })

      debugLog('Successfully joined room', { 
        socketId: socket.id, 
        roomCode: room.roomCode, 
        participantCount: room.participantCount 
      })

    } catch (error) {
      errorLog('Error joining room', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  // Handle slide navigation
  socket.on('slide-change', async (data: {
    presentationId: string
    slideIndex: number
  }) => {
    try {
      debugLog('Slide change request', { socketId: socket.id, ...data })
      
      const session = sessions.get(socket.id)
      if (!session || session.userRole !== 'presenter') {
        socket.emit('error', { message: 'Only presenters can change slides' })
        return
      }

      const room = await getRoomByPresentationId(data.presentationId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      room.currentSlideIndex = data.slideIndex
      await updateRoomSlideIndex(room.id, data.slideIndex)

      // Clear votes for new slide
      const roomVotes = votes.get(room.roomCode)
      if (roomVotes) {
        roomVotes.clear()
      }

      // Broadcast to all participants in the room
      io.to(room.roomCode).emit('slide-changed', {
        slideIndex: data.slideIndex,
        presentationId: data.presentationId
      })

      // Log event
      await logEvent(socket.id, data.presentationId, 'slide-change', {
        slideIndex: data.slideIndex
      })

      debugLog('Slide changed successfully', { 
        socketId: socket.id, 
        slideIndex: data.slideIndex 
      })

    } catch (error) {
      errorLog('Error changing slide', error)
      socket.emit('error', { message: 'Failed to change slide' })
    }
  })

  // Handle response submission
  socket.on('submit-response', async (data: {
    presentationId: string
    slideId: string
    response: any
    userName?: string
    slideType?: string
  }) => {
    try {
      debugLog('Response submission', { socketId: socket.id, ...data })
      
      const session = sessions.get(socket.id)
      if (!session) {
        socket.emit('error', { message: 'Session not found' })
        return
      }

      const supabase = await getServerSupabase()
      
      // Save response to database
      const { error: responseError } = await supabase
        .from('responses')
        .insert({
          presentation_id: data.presentationId,
          slide_id: data.slideId,
          response_data: data.response,
          user_name: data.userName || session.userName,
          session_id: socket.id
        })

      if (responseError) {
        errorLog('Error saving response to database', responseError)
        socket.emit('error', { message: 'Failed to submit response' })
        return
      }

      // Handle real-time voting for different question types
      const room = await getRoomByPresentationId(data.presentationId)
      if (room) {
        const roomVotes = votes.get(room.roomCode)
        if (roomVotes) {
          const slideVotes = roomVotes.get(data.slideId) || new Map()
          
          if (data.slideType === 'multiple-choice' || data.slideType === 'single-choice') {
            // Handle multiple/single choice voting
            const selectedOptions = Array.isArray(data.response.value) 
              ? data.response.value 
              : [data.response.value]
            
            selectedOptions.forEach((option: string) => {
              const currentCount = slideVotes.get(option) || 0
              slideVotes.set(option, currentCount + 1)
            })
          } else if (data.slideType === 'word-cloud') {
            // Handle word cloud voting
            const words = data.response.value.split(/\s+/).filter((word: string) => word.length > 0)
            words.forEach((word: string) => {
              const currentCount = slideVotes.get(word) || 0
              slideVotes.set(word, currentCount + 1)
            })
          }
          
          roomVotes.set(data.slideId, slideVotes)
          
          // Broadcast updated votes to presenter
          const voteData = Array.from(slideVotes.entries()).map(([option, count]) => ({
            option,
            count
          }))
          
          io.to(room.roomCode).emit('votes-updated', {
            slideId: data.slideId,
            votes: voteData,
            slideType: data.slideType
          })
        }
      }

      // Broadcast response to room
      if (room) {
        io.to(room.roomCode).emit('response-submitted', {
          slideId: data.slideId,
          response: data.response,
          userName: data.userName || session.userName,
          timestamp: new Date().toISOString()
        })
      }

      // Log event
      await logEvent(socket.id, data.presentationId, 'submit-response', {
        slideId: data.slideId,
        userName: data.userName || session.userName,
        slideType: data.slideType
      })

      debugLog('Response submitted successfully', { 
        socketId: socket.id, 
        slideId: data.slideId,
        slideType: data.slideType 
      })

    } catch (error) {
      errorLog('Error submitting response', error)
      socket.emit('error', { message: 'Failed to submit response' })
    }
  })

  // Handle presenter controls
  socket.on('presenter-control', async (data: {
    presentationId: string
    action: 'next-slide' | 'prev-slide' | 'show-results' | 'hide-results' | 'start-presentation' | 'end-presentation'
    slideIndex?: number
  }) => {
    try {
      debugLog('Presenter control request', { socketId: socket.id, ...data })
      
      const session = sessions.get(socket.id)
      if (!session || session.userRole !== 'presenter') {
        socket.emit('error', { message: 'Only presenters can use controls' })
        return
      }

      const room = await getRoomByPresentationId(data.presentationId)
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      let updatedData: any = {}

      switch (data.action) {
        case 'next-slide':
          room.currentSlideIndex++
          updatedData = { currentSlideIndex: room.currentSlideIndex }
          break
        case 'prev-slide':
          room.currentSlideIndex = Math.max(0, room.currentSlideIndex - 1)
          updatedData = { currentSlideIndex: room.currentSlideIndex }
          break
        case 'show-results':
          room.showResults = true
          updatedData = { showResults: true }
          break
        case 'hide-results':
          room.showResults = false
          updatedData = { showResults: false }
          break
        case 'start-presentation':
          room.isActive = true
          updatedData = { isActive: true }
          break
        case 'end-presentation':
          room.isActive = false
          updatedData = { isActive: false }
          break
      }

      // Update room in database
      await updateRoom(room.id, updatedData)

      // Broadcast to all participants
      io.to(room.roomCode).emit('presenter-control', {
        action: data.action,
        ...updatedData,
        presentationId: data.presentationId
      })

      // Log event
      await logEvent(socket.id, data.presentationId, 'presenter-control', {
        action: data.action,
        ...updatedData
      })

      debugLog('Presenter control executed successfully', { 
        socketId: socket.id, 
        action: data.action 
      })

    } catch (error) {
      errorLog('Error handling presenter control', error)
      socket.emit('error', { message: 'Failed to execute control' })
    }
  })

  // Handle participant list request
  socket.on('get-participants', async (data: { presentationId: string }) => {
    try {
      debugLog('Get participants request', { socketId: socket.id, ...data })
      
      const supabase = await getServerSupabase()
      
      const { data: participants, error } = await supabase
        .from('socket_sessions')
        .select('user_name, user_role, joined_at')
        .eq('presentation_id', data.presentationId)
        .eq('is_active', true)

      if (error) {
        errorLog('Error fetching participants from database', error)
        socket.emit('error', { message: 'Failed to fetch participants' })
        return
      }

      socket.emit('participants-list', {
        participants,
        presentationId: data.presentationId
      })

      debugLog('Participants list sent', { 
        socketId: socket.id, 
        participantCount: participants.length 
      })

    } catch (error) {
      errorLog('Error getting participants', error)
      socket.emit('error', { message: 'Failed to get participants' })
    }
  })

  // Handle user activity
  socket.on('user-activity', async (data: { presentationId: string }) => {
    try {
      const supabase = await getServerSupabase()
      
      await supabase
        .from('socket_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('socket_id', socket.id)
    } catch (error) {
      errorLog('Error updating user activity', error)
    }
  })

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      debugLog(`Client disconnecting: ${socket.id}`)
      
      const session = sessions.get(socket.id)
      if (!session) {
        debugLog('No session found for disconnecting client', { socketId: socket.id })
        return
      }

      const supabase = await getServerSupabase()
      
      // Update session as inactive
      await supabase
        .from('socket_sessions')
        .update({ is_active: false, last_activity: new Date().toISOString() })
        .eq('socket_id', socket.id)

      // Update room participant count
      const room = await getRoomByPresentationId(session.presentationId)
      if (room) {
        if (session.userRole === 'participant') {
          room.participantCount = Math.max(0, room.participantCount - 1)
          await updateRoomParticipantCount(room.id, room.participantCount)
        } else if (session.userRole === 'presenter' && room.presenterSocketId === socket.id) {
          room.presenterSocketId = undefined
          await updateRoomPresenter(room.id, null)
        }

        // Broadcast participant left
        socket.to(room.roomCode).emit('participant-left', {
          userName: session.userName,
          userRole: session.userRole,
          participantCount: room.participantCount
        })
      }

      // Remove from local storage
      sessions.delete(socket.id)

      debugLog(`Client disconnected successfully: ${socket.id}`)

    } catch (error) {
      errorLog('Error handling disconnect', error)
    }
  })
})

// Database helper functions
async function getOrCreateRoom(presentationId: string, roomCode: string) {
  try {
    const supabase = await getServerSupabase()
    
    // Try to get existing room
    let { data: room, error } = await supabase
      .from('presentation_rooms')
      .select('*')
      .eq('presentation_id', presentationId)
      .single()

    if (error || !room) {
      // Create new room
      const { data: newRoom, error: createError } = await supabase
        .from('presentation_rooms')
        .insert({
          presentation_id: presentationId,
          room_code: roomCode,
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        errorLog('Error creating room', createError)
        throw createError
      }
      
      debugLog('New room created', { roomCode, presentationId })
      return newRoom
    }

    debugLog('Existing room found', { roomCode, presentationId })
    return room
  } catch (error) {
    errorLog('Error in getOrCreateRoom', error)
    throw error
  }
}

async function getRoomByPresentationId(presentationId: string) {
  try {
    const supabase = await getServerSupabase()
    
    const { data: room, error } = await supabase
      .from('presentation_rooms')
      .select('*')
      .eq('presentation_id', presentationId)
      .single()

    if (error || !room) {
      debugLog('Room not found', { presentationId })
      return null
    }
    
    return room
  } catch (error) {
    errorLog('Error in getRoomByPresentationId', error)
    return null
  }
}

async function updateRoom(roomId: string, updates: any) {
  try {
    const supabase = await getServerSupabase()
    
    const { error } = await supabase
      .from('presentation_rooms')
      .update(updates)
      .eq('id', roomId)

    if (error) {
      errorLog('Error updating room', error)
      throw error
    }
    
    debugLog('Room updated successfully', { roomId, updates })
  } catch (error) {
    errorLog('Error in updateRoom', error)
    throw error
  }
}

async function updateRoomParticipantCount(roomId: string, count: number) {
  await updateRoom(roomId, { participant_count: count })
}

async function updateRoomPresenter(roomId: string, presenterSocketId: string | null) {
  await updateRoom(roomId, { presenter_socket_id: presenterSocketId })
}

async function updateRoomSlideIndex(roomId: string, slideIndex: number) {
  await updateRoom(roomId, { current_slide_index: slideIndex })
}

async function logEvent(socketId: string, presentationId: string, eventType: string, eventData: any) {
  try {
    const supabase = await getServerSupabase()
    
    await supabase
      .from('socket_events')
      .insert({
        socket_id: socketId,
        presentation_id: presentationId,
        event_type: eventType,
        event_data: eventData
      })
      
    debugLog('Event logged successfully', { eventType, socketId, presentationId })
  } catch (error) {
    errorLog('Error logging event', error)
  }
}

// Start server
const PORT = process.env.SOCKET_PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📊 Health check available at http://localhost:${PORT}/health`)
  console.log(`🔧 Debug mode: ${process.env.NODE_ENV === 'development' ? 'enabled' : 'disabled'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Process terminated')
  })
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Process terminated')
  })
})

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  errorLog('Uncaught Exception', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  errorLog('Unhandled Rejection', { reason, promise })
  process.exit(1)
})
