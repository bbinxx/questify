import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createServiceRoleClient } from '../supabase/service';

export interface SocketSession {
  id: string;
  socketId: string;
  userId?: string;
  presentationId: string;
  userName?: string;
  userRole: 'presenter' | 'participant';
  isActive: boolean;
}

export interface PresentationRoom {
  id: string;
  presentationId: string;
  roomCode: string;
  isActive: boolean;
  currentSlideIndex: number;
  showResults: boolean;
  presenterSocketId?: string;
  participantCount: number;
}

export class SocketManager {
  private io: SocketIOServer;
  private rooms: Map<string, PresentationRoom> = new Map();
  private sessions: Map<string, SocketSession> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle room join
      socket.on('join-room', async (data: {
        presentationId: string;
        roomCode: string;
        userName?: string;
        userRole?: 'presenter' | 'participant';
        userId?: string;
      }) => {
        await this.handleJoinRoom(socket, data);
      });

      // Handle slide navigation
      socket.on('slide-change', async (data: {
        presentationId: string;
        slideIndex: number;
      }) => {
        await this.handleSlideChange(socket, data);
      });

      // Handle response submission
      socket.on('submit-response', async (data: {
        presentationId: string;
        slideId: string;
        response: any;
        userName?: string;
      }) => {
        await this.handleSubmitResponse(socket, data);
      });

      // Handle presenter controls
      socket.on('presenter-control', async (data: {
        presentationId: string;
        action: 'next-slide' | 'prev-slide' | 'show-results' | 'hide-results' | 'start-presentation' | 'end-presentation';
        slideIndex?: number;
      }) => {
        await this.handlePresenterControl(socket, data);
      });

      // Handle participant list request
      socket.on('get-participants', async (data: { presentationId: string }) => {
        await this.handleGetParticipants(socket, data);
      });

      // Handle user activity
      socket.on('user-activity', async (data: { presentationId: string }) => {
        await this.updateUserActivity(socket.id, data.presentationId);
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinRoom(socket: any, data: {
    presentationId: string;
    roomCode: string;
    userName?: string;
    userRole?: 'presenter' | 'participant';
    userId?: string;
  }) {
    try {
      const supabase = createServiceRoleClient() as any;

      // Get or create room
      let room = await this.getOrCreateRoom(data.presentationId, data.roomCode);

      // Join socket room
      socket.join(room.roomCode);

      // Create session
      const session: SocketSession = {
        id: crypto.randomUUID(),
        socketId: socket.id,
        userId: data.userId,
        presentationId: data.presentationId,
        userName: data.userName || 'Anonymous',
        userRole: data.userRole || 'participant',
        isActive: true
      };

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
        });

      if (sessionError) {
        console.error('Error saving session:', sessionError);
      }

      // Update room participant count
      if (session.userRole === 'participant') {
        room.participantCount++;
        await this.updateRoomParticipantCount(room.id, room.participantCount);
      } else if (session.userRole === 'presenter') {
        room.presenterSocketId = socket.id;
        await this.updateRoomPresenter(room.id, socket.id);
      }

      // Store session locally
      this.sessions.set(socket.id, session);
      this.rooms.set(room.roomCode, room);

      // Emit join confirmation
      socket.emit('room-joined', {
        roomCode: room.roomCode,
        presentationId: data.presentationId,
        currentSlideIndex: room.currentSlideIndex,
        showResults: room.showResults,
        participantCount: room.participantCount
      });

      // Broadcast new participant to room
      socket.to(room.roomCode).emit('participant-joined', {
        userName: session.userName,
        userRole: session.userRole,
        participantCount: room.participantCount
      });

      // Log event
      await this.logEvent(socket.id, data.presentationId, 'join-room', {
        userName: session.userName,
        userRole: session.userRole
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private async handleSlideChange(socket: any, data: {
    presentationId: string;
    slideIndex: number;
  }) {
    try {
      const session = this.sessions.get(socket.id);
      if (!session || session.userRole !== 'presenter') {
        socket.emit('error', { message: 'Only presenters can change slides' });
        return;
      }

      const room = await this.getRoomByPresentationId(data.presentationId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      room.currentSlideIndex = data.slideIndex;
      await this.updateRoomSlideIndex(room.id, data.slideIndex);

      // Broadcast to all participants in the room
      this.io.to(room.roomCode).emit('slide-changed', {
        slideIndex: data.slideIndex,
        presentationId: data.presentationId
      });

      // Log event
      await this.logEvent(socket.id, data.presentationId, 'slide-change', {
        slideIndex: data.slideIndex
      });

    } catch (error) {
      console.error('Error changing slide:', error);
      socket.emit('error', { message: 'Failed to change slide' });
    }
  }

  private async handleSubmitResponse(socket: any, data: {
    presentationId: string;
    slideId: string;
    response: any;
    userName?: string;
  }) {
    try {
      const session = this.sessions.get(socket.id);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const supabase = createServiceRoleClient() as any;

      // Save response to database
      const { error: responseError } = await supabase
        .from('responses')
        .insert({
          presentation_id: data.presentationId,
          slide_id: data.slideId,
          response_data: data.response,
          user_name: data.userName || session.userName,
          session_id: socket.id
        });

      if (responseError) {
        console.error('Error saving response:', responseError);
        socket.emit('error', { message: 'Failed to submit response' });
        return;
      }

      // Broadcast response to room
      const room = await this.getRoomByPresentationId(data.presentationId);
      if (room) {
        this.io.to(room.roomCode).emit('response-submitted', {
          slideId: data.slideId,
          response: data.response,
          userName: data.userName || session.userName,
          timestamp: new Date().toISOString()
        });
      }

      // Log event
      await this.logEvent(socket.id, data.presentationId, 'submit-response', {
        slideId: data.slideId,
        userName: data.userName || session.userName
      });

    } catch (error) {
      console.error('Error submitting response:', error);
      socket.emit('error', { message: 'Failed to submit response' });
    }
  }

  private async handlePresenterControl(socket: any, data: {
    presentationId: string;
    action: 'next-slide' | 'prev-slide' | 'show-results' | 'hide-results' | 'start-presentation' | 'end-presentation';
    slideIndex?: number;
  }) {
    try {
      const session = this.sessions.get(socket.id);
      if (!session || session.userRole !== 'presenter') {
        socket.emit('error', { message: 'Only presenters can use controls' });
        return;
      }

      const room = await this.getRoomByPresentationId(data.presentationId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      let updatedData: any = {};

      switch (data.action) {
        case 'next-slide':
          room.currentSlideIndex++;
          updatedData = { currentSlideIndex: room.currentSlideIndex };
          break;
        case 'prev-slide':
          room.currentSlideIndex = Math.max(0, room.currentSlideIndex - 1);
          updatedData = { currentSlideIndex: room.currentSlideIndex };
          break;
        case 'show-results':
          room.showResults = true;
          updatedData = { showResults: true };
          break;
        case 'hide-results':
          room.showResults = false;
          updatedData = { showResults: false };
          break;
        case 'start-presentation':
          room.isActive = true;
          updatedData = { isActive: true };
          break;
        case 'end-presentation':
          room.isActive = false;
          updatedData = { isActive: false };
          break;
      }

      // Update room in database
      await this.updateRoom(room.id, updatedData);

      // Broadcast to all participants
      this.io.to(room.roomCode).emit('presenter-control', {
        action: data.action,
        ...updatedData,
        presentationId: data.presentationId
      });

      // Log event
      await this.logEvent(socket.id, data.presentationId, 'presenter-control', {
        action: data.action,
        ...updatedData
      });

    } catch (error) {
      console.error('Error handling presenter control:', error);
      socket.emit('error', { message: 'Failed to execute control' });
    }
  }

  private async handleGetParticipants(socket: any, data: { presentationId: string }) {
    try {
      const supabase = createServiceRoleClient() as any;

      const { data: participants, error } = await supabase
        .from('socket_sessions')
        .select('user_name, user_role, joined_at')
        .eq('presentation_id', data.presentationId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching participants:', error);
        socket.emit('error', { message: 'Failed to fetch participants' });
        return;
      }

      socket.emit('participants-list', {
        participants,
        presentationId: data.presentationId
      });

    } catch (error) {
      console.error('Error getting participants:', error);
      socket.emit('error', { message: 'Failed to get participants' });
    }
  }

  private async handleDisconnect(socket: any) {
    try {
      const session = this.sessions.get(socket.id);
      if (!session) return;

      const supabase = createServiceRoleClient() as any;

      // Update session as inactive
      await supabase
        .from('socket_sessions')
        .update({ is_active: false, last_activity: new Date().toISOString() })
        .eq('socket_id', socket.id);

      // Update room participant count
      const room = await this.getRoomByPresentationId(session.presentationId);
      if (room) {
        if (session.userRole === 'participant') {
          room.participantCount = Math.max(0, room.participantCount - 1);
          await this.updateRoomParticipantCount(room.id, room.participantCount);
        } else if (session.userRole === 'presenter' && room.presenterSocketId === socket.id) {
          room.presenterSocketId = undefined;
          await this.updateRoomPresenter(room.id, null);
        }

        // Broadcast participant left
        socket.to(room.roomCode).emit('participant-left', {
          userName: session.userName,
          userRole: session.userRole,
          participantCount: room.participantCount
        });
      }

      // Remove from local storage
      this.sessions.delete(socket.id);

      console.log(`Client disconnected: ${socket.id}`);

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  private async updateUserActivity(socketId: string, presentationId: string) {
    try {
      const supabase = createServiceRoleClient() as any;

      await supabase
        .from('socket_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('socket_id', socketId);
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  // Database helper methods
  private async getOrCreateRoom(presentationId: string, roomCode: string): Promise<PresentationRoom> {
    const supabase = createServiceRoleClient();

    // Try to get existing room
    let { data: room, error } = await supabase
      .from('presentation_rooms')
      .select('*')
      .eq('presentation_id', presentationId)
      .single();

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
        .single();

      if (createError) throw createError;
      return newRoom;
    }

    return room;
  }

  private async getRoomByPresentationId(presentationId: string): Promise<PresentationRoom | null> {
    const supabase = createServiceRoleClient();

    const { data: room, error } = await supabase
      .from('presentation_rooms')
      .select('*')
      .eq('presentation_id', presentationId)
      .single();

    if (error || !room) return null;
    return room;
  }

  private async updateRoom(roomId: string, updates: any) {
    const supabase = createServiceRoleClient();

    await supabase
      .from('presentation_rooms')
      .update(updates)
      .eq('id', roomId);
  }

  private async updateRoomParticipantCount(roomId: string, count: number) {
    await this.updateRoom(roomId, { participant_count: count });
  }

  private async updateRoomPresenter(roomId: string, presenterSocketId: string | null) {
    await this.updateRoom(roomId, { presenter_socket_id: presenterSocketId });
  }

  private async updateRoomSlideIndex(roomId: string, slideIndex: number) {
    await this.updateRoom(roomId, { current_slide_index: slideIndex });
  }

  private async logEvent(socketId: string, presentationId: string, eventType: string, eventData: any) {
    try {
      const supabase = createServiceRoleClient() as any;

      await supabase
        .from('socket_events')
        .insert({
          socket_id: socketId,
          presentation_id: presentationId,
          event_type: eventType,
          event_data: eventData
        });
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

let socketManager: SocketManager | null = null;

export function initializeSocket(server: HTTPServer): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
}

export function getSocketManager(): SocketManager | null {
  return socketManager;
}
