# Questify - Interactive Presentations

A modern, real-time interactive presentation platform built with Next.js, Socket.IO, and Supabase. Create engaging presentations with live audience participation, similar to Mentimeter.

## 🚀 **Features**

### **Interactive Question Types**
- **Multiple Choice**: Select multiple options with real-time voting
- **Single Choice**: Select one option with instant results
- **Text Response**: Free-form text input for open-ended questions
- **Word Cloud**: Enter words separated by spaces for frequency visualization
- **Question Only**: Display questions for discussion without responses

### **Real-time Functionality**
- **Live Voting**: Real-time vote counting and visualization
- **Bar Charts**: Dynamic vote distribution charts
- **Word Clouds**: Words grow/shrink based on frequency
- **Live Participants**: See who's in the presentation
- **Instant Results**: Show/hide results in real-time

### **Presentation Management**
- **Slide Builder**: Drag-and-drop slide creation
- **Question Type Selection**: Easy switching between question types
- **Slide Reordering**: Move slides up/down
- **Slide Duplication**: Copy existing slides
- **Settings Panel**: Configure presentation options

### **PWA Support**
- **Installable App**: Works on all devices
- **Offline Support**: Basic functionality without internet
- **App Shortcuts**: Quick access to common actions
- **Responsive Design**: Optimized for mobile and desktop

## 🏗️ **Architecture**

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Socket.IO Client**: Real-time communication
- **PWA**: Progressive Web App capabilities

### **Backend**
- **Socket.IO Server**: Real-time event handling
- **Express.js**: HTTP server framework
- **Supabase**: Database and authentication
- **PostgreSQL**: Relational database

### **Real-time Features**
- **Room Management**: Unique room codes for presentations
- **Session Tracking**: User activity and connection status
- **Event Logging**: Comprehensive audit trail
- **Error Handling**: Robust error recovery

## ⚙️ **Setup Instructions**

### **1. Prerequisites**
- Node.js 18+ 
- npm or pnpm
- Supabase account

### **2. Clone and Install**
```bash
git clone <repository-url>
cd questify
npm install
```

### **3. Environment Variables**
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Socket.IO
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Debug
NODE_ENV=development
DEBUG=socket.io:*
```

### **4. Database Setup**
Run the SQL scripts in your Supabase SQL editor:
```sql
-- Execute scripts/004_socket_sessions.sql
```

### **5. Start Development Servers**
```bash
# Terminal 1: Socket.IO Server
npm run socket:dev

# Terminal 2: Next.js App
npm run dev
```

### **6. Build for Production**
```bash
# Build Socket.IO server
npm run socket:build

# Build Next.js app
npm run build

# Start production servers
npm run socket:start
npm start
```

## 🎯 **Usage**

### **Creating a Presentation**

1. **Access the Builder**
   - Navigate to the presentation builder
   - Click "Add New Slide" to create slides

2. **Choose Question Type**
   - Select from 5 question types
   - Configure options and settings
   - Preview the slide

3. **Configure Settings**
   - Allow anonymous participation
   - Set time limits
   - Configure result visibility

4. **Start Presentation**
   - Click "Start Presentation"
   - Share the room code with participants

### **Participant Experience**

1. **Join Presentation**
   - Enter the room code
   - Provide your name (optional)

2. **Respond to Questions**
   - See questions in real-time
   - Submit responses instantly
   - View live results (if enabled)

3. **Real-time Updates**
   - See participant count
   - View live vote updates
   - Get instant feedback

### **Presenter Controls**

1. **Slide Navigation**
   - Next/Previous slides
   - Jump to specific slides
   - Control presentation flow

2. **Result Management**
   - Show/hide results
   - Control result visibility
   - Manage participant responses

3. **Live Monitoring**
   - View participant count
   - Monitor response rates
   - Track engagement

## 📱 **PWA Features**

### **Installation**
- **Desktop**: Click install button in browser
- **Mobile**: Add to home screen from browser menu
- **Automatic**: Browser prompts for installation

### **Offline Capabilities**
- **Basic Navigation**: Browse cached pages
- **Presentation View**: View existing presentations
- **Limited Functionality**: No real-time features offline

### **App Shortcuts**
- **Create Presentation**: Quick access to builder
- **Join Presentation**: Direct to join form
- **Recent Presentations**: Access recent items

## 🔧 **Development**

### **Project Structure**
```
questify/
├── app/                    # Next.js App Router
├── components/            # React components
│   └── presentations/     # Presentation components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── server/                # Socket.IO server
├── scripts/               # Database scripts
└── public/                # Static assets
```

### **Key Components**

#### **SlideEditor**
- Question type selection
- Option management
- Settings configuration
- Real-time preview

#### **PresentationBuilder**
- Slide management
- Presentation settings
- Room code generation
- Export/import functionality

#### **MentimeterParticipantView**
- Clean, modern interface
- Real-time response forms
- Live result visualization
- Mobile-optimized design

#### **Socket.IO Integration**
- Real-time communication
- Room management
- Session tracking
- Error handling

### **Database Schema**

#### **socket_sessions**
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
```

#### **presentation_rooms**
```sql
- id: UUID (Primary Key)
- presentation_id: UUID (References presentations)
- room_code: TEXT (Unique)
- is_active: BOOLEAN
- current_slide_index: INTEGER
- show_results: BOOLEAN
- presenter_socket_id: TEXT
- participant_count: INTEGER
```

#### **socket_events**
```sql
- id: UUID (Primary Key)
- socket_id: TEXT
- presentation_id: UUID (References presentations)
- event_type: TEXT
- event_data: JSONB
- timestamp: TIMESTAMPTZ
```

## 🎨 **Question Types**

### **Multiple Choice**
- Select multiple options
- Real-time vote counting
- Bar chart visualization
- Configurable settings

### **Single Choice**
- Select one option
- Instant results
- Radio button interface
- Live updates

### **Text Response**
- Free-form text input
- Character limits
- Response collection
- Export functionality

### **Word Cloud**
- Word frequency analysis
- Dynamic visualization
- Size-based display
- Real-time updates

### **Question Only**
- Display questions
- Discussion prompts
- No response collection
- Timer support

## 🔒 **Security**

### **Authentication**
- Supabase Auth integration
- User session management
- Role-based access control
- Secure API endpoints

### **Data Protection**
- Row Level Security (RLS)
- Encrypted connections
- Input validation
- XSS protection

### **Privacy**
- Anonymous participation option
- Data retention policies
- GDPR compliance
- User consent management

## 📊 **Analytics**

### **Real-time Metrics**
- Participant count
- Response rates
- Engagement tracking
- Session duration

### **Event Logging**
- User actions
- System events
- Error tracking
- Performance monitoring

### **Export Options**
- CSV export
- JSON data
- PDF reports
- Real-time dashboards

## 🚀 **Deployment**

### **Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Docker Deployment**
```bash
# Build image
docker build -t questify .

# Run container
docker run -p 3000:3000 -p 3001:3001 questify
```

### **Environment Variables**
```env
# Production
NODE_ENV=production
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Socket Connection Failed**
   - Check Socket.IO server is running
   - Verify environment variables
   - Check CORS configuration

2. **Database Errors**
   - Ensure tables are created
   - Check RLS policies
   - Verify credentials

3. **PWA Not Installing**
   - Check HTTPS requirement
   - Verify manifest.json
   - Clear browser cache

4. **Real-time Issues**
   - Check network connectivity
   - Verify room codes match
   - Review server logs

### **Debug Mode**
Enable debug logging:
```env
DEBUG=socket.io:*
NODE_ENV=development
```

### **Logs**
- **Server Logs**: Socket.IO server console
- **Client Logs**: Browser developer tools
- **Database Logs**: Supabase dashboard

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### **Code Standards**
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

### **Testing**
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📄 **License**

MIT License - see LICENSE file for details.

## 🆘 **Support**

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@questify.com

## 🙏 **Acknowledgments**

- **Mentimeter**: Inspiration for interactive features
- **Socket.IO**: Real-time communication
- **Supabase**: Backend infrastructure
- **Next.js**: React framework
- **Tailwind CSS**: Styling framework

---

**Questify** - Making presentations interactive and engaging! 🎯