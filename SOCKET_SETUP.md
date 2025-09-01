# Socket.IO Real-Time Presentation System

This document provides a comprehensive guide to setting up and using the enhanced Socket.IO real-time presentation system with Supabase integration, featuring new question types, real-time voting, word clouds, and comprehensive error handling.

## 🚀 **New Features**

### **Enhanced Question Types**
- **Text Responses**: Free-form text input
- **Single Choice**: Radio button selection
- **Multiple Choice**: Checkbox selection
- **Word Cloud**: Enter words separated by spaces
- **Question Only**: Display-only slides for discussion

### **Real-time Voting & Visualization**
- **Live Vote Tracking**: Real-time vote counting
- **Bar Chart Visualization**: Dynamic vote distribution
- **Word Cloud Visualization**: Words grow/shrink based on frequency
- **Presenter Dashboard**: Live results for presenters
- **Participant View**: Results when shown by presenter

### **Comprehensive Error Handling & Debugging**
- **Detailed Logging**: Console logs with emojis for easy identification
- **Error Recovery**: Automatic reconnection with exponential backoff
- **Debug Mode**: Toggle-able debug information
- **Health Monitoring**: Server health checks and status endpoints
- **Session Management**: Robust user session tracking

## 📋 **Overview**

The system provides real-time functionality for live presentations including:
- Room-based presentation sessions
- Real-time slide navigation
- Live participant responses with multiple question types
- Presenter controls with live vote visualization
- Session management with comprehensive error handling
- User activity tracking and debugging tools

## 🏗️ **Architecture**

### **Components**

1. **Enhanced Socket.IO Server** (`server/socket-server.ts`)
   - Standalone Express server with Socket.IO
   - Comprehensive error handling and logging
   - Real-time vote tracking and management
   - Session persistence and cleanup
   - Health monitoring endpoints

2. **Enhanced Socket.IO Client Hook** (`hooks/use-socket.ts`)
   - React hook with automatic reconnection
   - Exponential backoff for failed connections
   - Real-time vote state management
   - Comprehensive error handling
   - Debug mode support

3. **Database Tables** (`scripts/004_socket_sessions.sql`)
   - `socket_sessions`: Tracks active user sessions
   - `presentation_rooms`: Manages presentation rooms
   - `socket_events`: Logs real-time events for analytics

4. **Enhanced UI Components**
   - `RealtimePresentation`: Presenter view with live vote visualization
   - `ParticipantView`: Participant view with new question types
   - `PresentationIntegrationExample`: Complete integration example

## ⚙️ **Setup Instructions**

### **1. Database Setup**

Run the SQL script to create the necessary tables:

```sql
-- Execute the script in your Supabase SQL editor
-- File: scripts/004_socket_sessions.sql
```

### **2. Environment Variables**

Add the following environment variables to your `.env.local`:

```env
# Socket.IO Server
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Debug Mode (optional)
NODE_ENV=development
DEBUG=socket.io:*

# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **3. Install Dependencies**

```bash
npm install socket.io socket.io-client @types/socket.io express cors dotenv tsx @types/express
```

### **4. Start the Socket.IO Server**

#### **Development Mode**
```bash
npm run socket:dev
```

#### **Production Mode**
```bash
npm run socket:build
npm run socket:start
```

The server will start on port 3001 (or the port specified in SOCKET_PORT).

### **5. Start the Next.js Application**

```bash
npm run dev
```

## 🎯 **Usage Examples**

### **Basic Implementation**

#### **1. Enhanced Presenter View**

```tsx
import { RealtimePresentation } from '@/components/presentations/realtime-presentation'

function PresenterView() {
  return (
    <RealtimePresentation
      presentationId="your-presentation-id"
      roomCode="ABC123"
      userRole="presenter"
      userName="John Doe"
      userId="user-id"
      debug={true} // Enable debug mode
      onSlideChange={(slideIndex) => {
        console.log('Slide changed to:', slideIndex)
      }}
      onShowResults={(show) => {
        console.log('Results visibility:', show)
      }}
      onPresentationStateChange={(isActive) => {
        console.log('Presentation state:', isActive)
      }}
    />
  )
}
```

#### **2. Enhanced Participant View**

```tsx
import { ParticipantView } from '@/components/presentations/participant-view'

function ParticipantView() {
  return (
    <ParticipantView
      presentationId="your-presentation-id"
      roomCode="ABC123"
      userName="Jane Smith"
      userId="user-id"
      currentSlide={currentSlideData}
      debug={true} // Enable debug mode
      onResponseSubmitted={(response) => {
        console.log('Response submitted:', response)
      }}
    />
  )
}
```

#### **3. Complete Integration Example**

```tsx
import { PresentationIntegrationExample } from '@/components/presentations/presentation-integration-example'

export default function PresentationPage({ params }: { params: { id: string } }) {
  const presentationId = params.id
  const roomCode = "ABC123"
  const isPresenter = true
  const userName = "John Doe"
  const userId = "user-id"
  
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
```

#### **4. Custom Socket Hook Usage**

```tsx
import { useSocket } from '@/hooks/use-socket'

function CustomComponent() {
  const {
    socket,
    isConnected,
    error,
    room,
    participants,
    votes, // New: real-time votes
    joinRoom,
    submitResponse,
    presenterControl
  } = useSocket({
    presentationId: 'your-presentation-id',
    roomCode: 'ABC123',
    userRole: 'participant',
    userName: 'User Name',
    debug: true, // Enable debug mode
    autoConnect: true,
    eventHandlers: {
      onRoomJoined: (data) => {
        console.log('🎯 Joined room:', data)
      },
      onSlideChanged: (data) => {
        console.log('📄 Slide changed:', data)
      },
      onVotesUpdated: (data) => {
        console.log('🗳️ Votes updated:', data)
        // Handle real-time vote updates
      },
      onError: (data) => {
        console.error('❌ Socket error:', data)
      }
    }
  })

  // Use the socket functions as needed
  const handleSubmitVote = (response: any) => {
    submitResponse({
      presentationId: 'your-presentation-id',
      slideId: 'slide-1',
      response,
      slideType: 'multiple-choice' // Specify question type
    })
  }

  return (
    <div>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Participants: {participants.length}</div>
      <div>Active Votes: {votes.length}</div>
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

## 📡 **Enhanced Socket Events**

### **Client to Server Events**

- `join-room`: Join a presentation room
- `slide-change`: Change the current slide (presenter only)
- `submit-response`: Submit a response with question type
- `presenter-control`: Execute presenter controls
- `get-participants`: Get list of participants
- `user-activity`: Update user activity

### **Server to Client Events**

- `room-joined`: Confirmation of room join
- `participant-joined`: New participant joined
- `participant-left`: Participant left
- `slide-changed`: Slide was changed
- `response-submitted`: New response submitted
- `presenter-control`: Presenter control executed
- `participants-list`: List of participants
- `votes-updated`: Real-time vote updates (NEW)
- `error`: Error message

## 🗄️ **Database Schema**

### **socket_sessions**
```sql
- id: UUID (Primary Key)
- socket_id: TEXT (Unique)
- user_id: UUID (References auth.users)
- presentation_id: UUID (References presentations)
- user_name: TEXT
- user_role: TEXT (presenter/participant)
- is_active: BOOLEAN
- joined_at: TIMESTAMPTZ
- last_activity: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### **presentation_rooms**
```sql
- id: UUID (Primary Key)
- presentation_id: UUID (References presentations)
- room_code: TEXT (Unique)
- is_active: BOOLEAN
- current_slide_index: INTEGER
- show_results: BOOLEAN
- presenter_socket_id: TEXT
- participant_count: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### **socket_events**
```sql
- id: UUID (Primary Key)
- socket_id: TEXT
- presentation_id: UUID (References presentations)
- event_type: TEXT
- event_data: JSONB
- timestamp: TIMESTAMPTZ
```

## ✨ **Enhanced Features**

### **Real-time Functionality**
- **Live Slide Navigation**: Presenters can control slides in real-time
- **Instant Response Collection**: Participant responses with multiple question types
- **Live Vote Visualization**: Real-time bar charts and word clouds
- **Live Participant Tracking**: See who's in the presentation
- **Real-time Results**: Show/hide results instantly
- **Activity Monitoring**: Track user activity and session state

### **Question Types**
- **Text Responses**: Free-form text input for open-ended questions
- **Single Choice**: Radio button selection for one answer
- **Multiple Choice**: Checkbox selection for multiple answers
- **Word Cloud**: Enter words separated by spaces for word frequency analysis
- **Question Only**: Display-only slides for discussion without responses

### **Room Management**
- **Unique Room Codes**: Each presentation gets a unique room code
- **Session Persistence**: Sessions are stored in Supabase
- **Automatic Cleanup**: Inactive sessions are cleaned up automatically
- **Role-based Access**: Presenter and participant roles with different permissions

### **Real-time Voting**
- **Live Vote Tracking**: Votes are counted in real-time
- **Bar Chart Visualization**: Dynamic vote distribution charts
- **Word Cloud Visualization**: Words grow/shrink based on frequency
- **Presenter Dashboard**: Live results for presenters
- **Participant View**: Results when shown by presenter

### **Broadcasting & Events**
- **Room-based Broadcasting**: Events are broadcast to specific rooms
- **Selective Updates**: Only relevant participants receive updates
- **Comprehensive Error Handling**: Robust error handling and recovery
- **Debug Logging**: Detailed console logs for troubleshooting

## 🔒 **Security**

### **Row Level Security (RLS)**
- Users can only access sessions for presentations they have access to
- Users can only manage their own sessions
- Presentation owners can manage rooms

### **Authentication**
- Socket connections are validated against Supabase auth
- User sessions are tracked and validated
- Activity monitoring prevents abuse

## 📊 **Monitoring and Analytics**

### **Event Logging**
All real-time events are logged to the `socket_events` table for:
- Debugging and troubleshooting
- Analytics and insights
- Audit trails
- Performance monitoring

### **Health Checks**
The Socket.IO server provides enhanced health check endpoints:
```
GET http://localhost:3001/health
```
Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "activeConnections": 5,
  "activeRooms": 2
}
```

### **Debug Mode**
Enable debug logging by setting:
```env
DEBUG=socket.io:*
NODE_ENV=development
```

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Connection Failed**
   - Check if Socket.IO server is running
   - Verify environment variables
   - Check CORS configuration
   - Review server logs for errors

2. **Database Errors**
   - Ensure Supabase tables are created
   - Check RLS policies
   - Verify database credentials
   - Review database logs

3. **Events Not Received**
   - Check room code matches
   - Verify user role permissions
   - Check event handler setup
   - Review client-side logs

4. **Votes Not Updating**
   - Verify question type is specified
   - Check vote data format
   - Review vote processing logic
   - Check real-time event handlers

### **Debug Mode**

Enable debug mode in components:
```tsx
<RealtimePresentation
  // ... other props
  debug={true}
/>
```

Enable debug mode in hook:
```tsx
const { ... } = useSocket({
  // ... other options
  debug: true
})
```

### **Server Logs**

The server provides detailed logging with emojis:
- 🚀 Server startup
- 🔌 Client connections
- 🎯 Room joins
- 📄 Slide changes
- 🗳️ Vote updates
- ❌ Errors
- 🛑 Shutdown

## ⚡ **Performance Considerations**

### **Scaling**
- The standalone Socket.IO server can be scaled horizontally
- Use Redis adapter for multiple server instances
- Consider load balancing for high-traffic applications

### **Optimization**
- Implement connection pooling
- Use efficient event handling
- Monitor memory usage
- Implement rate limiting
- Optimize vote processing

## 🚀 **Deployment**

### **Production Setup**
1. Build the Socket.IO server: `npm run socket:build`
2. Deploy to your hosting platform
3. Set production environment variables
4. Configure reverse proxy if needed
5. Set up monitoring and logging

### **Environment Variables for Production**
```env
NODE_ENV=production
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
DEBUG=false
```

## 🆘 **Support**

For issues and questions:
1. Check the troubleshooting section
2. Review the event logs in Supabase
3. Check the Socket.IO server logs
4. Verify database connectivity
5. Enable debug mode for detailed logging

## 🤝 **Contributing**

When contributing to the Socket.IO system:
1. Follow the existing code structure
2. Add appropriate error handling
3. Update the documentation
4. Test with multiple clients
5. Ensure backward compatibility
6. Add comprehensive logging
7. Test all question types

## 📝 **Changelog**

### **v2.0.0 - Enhanced Features**
- ✅ Added new question types (word-cloud, question-only)
- ✅ Real-time vote tracking and visualization
- ✅ Comprehensive error handling and debugging
- ✅ Enhanced logging with emojis
- ✅ Automatic reconnection with exponential backoff
- ✅ Health monitoring endpoints
- ✅ Debug mode for troubleshooting
- ✅ Live vote visualization for presenters
- ✅ Word cloud visualization
- ✅ Bar chart visualization
- ✅ Enhanced session management
