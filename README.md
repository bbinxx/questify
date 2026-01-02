# Quest ify - Interactive Presentations Platform

**Version 2.0.0** | Modern, real-time interactive presentation platform | Built with Next.js 14, Supabase & Socket.IO

> Create engaging presentations with live polls, Q&A, quizzes, and word clouds. A powerful Mentimeter alternative.

---

## ✨ Features

### 📊 Interactive Question Types
- **Multiple Choice** - Select multiple options with real-time voting
- **Single Choice** - Select one option with instant results
- **Word Cloud** - Word frequency visualization
- **Text Response** - Free-form text input
- **Rating Scale** - Stars, emoji, numeric ratings ⭐
- **Ranking** - Drag-and-drop ranking 🆕
- **Q&A** - Live questions with upvoting 🆕
- **Quiz Mode** - Points, timers, leaderboards 🆕
- **Pin on Image** - Click heatmaps 🆕
- **2x2 Grid** - Quadrant analysis 🆕

### ⚡ Real-time Features
- Live vote counting
- Instant result visualization
- Participant tracking
- Socket.IO powered updates
- Room-based isolation

### 🎨 Beautiful UI/UX
- Modern, gradient-based des ign
- Responsive (mobile/desktop)
- Smooth animations
- Loading & error states
- Accessibility (ARIA labels)

---

## 🏗️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Socket.IO Client
- PWA Support

**Backend:**
- Supabase (PostgreSQL)
- Socket.IO Server
- Row Level Security (RLS)
- Real-time subscriptions

**Architecture:**
- Data-driven design (centralized config)
- Comprehensive error handling
- Connection verification
- Retry logic
- Type-safe throughout

---

## 🚀 Quick Start

### 1. Prerequisites
```bash
Node.js 18+
npm or pnpm
Supabase account
```

### 2. Install Dependencies
```bash
git clone <repository-url>
cd questify
npm install
```

### 3. Environment Setup
Create `.env.local`:
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Socket.IO
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### 4. Database Migration (CRITICAL!)
Run in Supabase SQL Editor:
```bash
# Open: https://supabase.com/dashboard
# SQL Editor → New Query
# Paste: migrations/001_mentimeter_enhanced_schema.sql
# Click: Run
```

This creates:
- 7 new tables (Q&A, analytics, themes, etc.)
- 7 database functions
- 20+ RLS policies
- 15+ performance indexes

### 5. Start Servers
```bash
# Terminal 1: Socket.IO
npm run socket:dev

# Terminal 2: Next.js
npm run dev

# Or both:
npm run dev:full
```

**App runs at:** http://localhost:3000

---

## 📁 Project Structure

```
questify/
├── app/                          # Next.js routes
│   ├── page.tsx                  # Landing page
│   ├── admin/                    # Dashboard routes
│   │   ├── page.tsx              # Presentation list
│   │   └── [id]/                 # Presentation editor
│   │       ├── page.tsx          # Edit view
│   │       ├── present/          # Presenter mode
│   │       └── analytics/        # Analytics dashboard
│   └── p/[code]/                 # Participant join
│       └── page.tsx
│
├── components/                   # React components
│   └── presentations/
│       ├── join-form.tsx         # Join by code
│       ├── presentation-list.tsx # Dashboard grid
│       ├── admin-presentation-view.tsx
│       ├── participant-presentation-view.tsx
│       └── slides/               # Question types
│           ├── scale-slide.tsx
│           ├── qa-slide.tsx
│           └── quiz-slide.tsx
│
├── lib/                          # Core utilities
│   ├── config/
│   │   └── app-config.ts         # Central configuration
│   ├── utils/
│   │   ├── error-handler.ts      # Error handling
│   │   └── db-connection.ts      # DB verification
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── custom-auth.ts        # Auth helpers
│   ├── types/
│   │   └── database.ts           # TypeScript types
│   ├── database-helpers.ts       # DB operations
│   └── db.ts                     # Postgres client
│
├── migrations/                   # Database schemas
│   ├── 001_mentimeter_enhanced_schema.sql
│   └── README.md
│
└── lib/socket/                   # Socket.IO server
    └── server.ts
```

---

## 🗄️ Database Schema

### Core Tables
- `presentations` - Presentation metadata
- `slides` - Question slides
- `responses` - Participant answers
- `presentation_rooms` - Active sessions

### Enhanced Tables (NEW)
- `user_profiles` - User settings
- `presentation_themes` - Custom branding
- `qa_questions` - Live Q&A
- `qa_upvotes` - Question voting
- `analytics_events` - Usage tracking
- `presentation_collaborators` - Sharing
- `presentation_media` - File uploads

### Key Functions
- `get_presentation_analytics()` - Stats
- `get_top_qa_questions()` - Top questions
- `increment_qa_upvotes()` - Upvote handler
- `toggle_qa_answered()` - Mark answered

---

## 🛠️ Configuration

### App Config (`lib/config/app-config.ts`)

All text, messages, and settings are centralized:

```typescript
import { APP_CONFIG, UI_TEXT, ROUTES } from '@/lib/config/app-config'

// App metadata
APP_CONFIG.name           // "Questify"
APP_CONFIG.version        // "2.0.0"

// Routes
ROUTES.home              // "/"
ROUTES.admin             // "/admin"
ROUTES.join(code)        // "/p/ABC123"

// UI Text
UI_TEXT.landing.hero.title
UI_TEXT.dashboard.empty.title
UI_TEXT.errors.database.connection
```

### Error Handling

```typescript
import { withErrorHandling, logger } from '@/lib/utils/error-handler'

// Async operations
const { data, error } = await withErrorHandling(
  async () => await supabase.from('presentations').select(),
  'Failed to load presentations'
)

// Logging
logger.info('User joined', { code })
logger.error('Connection failed', error)
logger.success('Saved successfully')
```

### Database Connection

```typescript
import { dbConnection } from '@/lib/utils/db-connection'

// Verify connection
const status = await dbConnection.verifyConnection()
// {connected: true, latency: 45, timestamp: Date}

// Health check
const health = await dbConnection.healthCheck()
// {overall: true, checks: {connection: true, presentations: true, ...}}
```

---

## 🎯 Development Workflow

### 1. Making Changes
All text/messages → `lib/config/app-config.ts`  
Error messages → Use `UI_TEXT.errors.*`  
New features → Update config first  

### 2. Error Handling
Always wrap async calls:
```typescript
const { data, error } = await withErrorHandling(asyncOperation)
if (error) {
  // Handle error
}
```

### 3. Database Operations
Use helpers from `lib/database-helpers.ts`:
```typescript
import { submitQAQuestion, getPresentationAnalytics } from '@/lib/database-helpers'
```

### 4. Testing
```bash
npm run build          # Production build
npm run lint           # ESLint
npm run type-check     # TypeScript
```

---

## 📊 Analytics & Metrics

### Available Metrics
- Total participants
- Response rates
- Average response time
- Engagement score
- Q&A activity
- Popular questions

### Accessing Analytics
```typescript
import { getPresentationAnalytics } from '@/lib/database-helpers'

const analytics = await getPresentationAnalytics(presentationId)
// Returns: {
//   total_responses: number
//   total_participants: number
//   avg_response_time: number
//   slides_data: [...]}
// }
```

---

## 🔒 Security

### Authentication
-  Supabase Auth
- Row Level Security (RLS)
- Session validation
- JWT tokens

### Database Security
- RLS policies on all tables
- User-level data isolation
- Service role for admin ops
- Input sanitization

### Best Practices
- Environment variables for secrets
- HTTPS in production
- CORS configuration
- Rate limiting (Socket.IO)

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Environment variables in Vercel dashboard.

### Other Platforms
Works on: Netlify, Railway, Render

### Socket.IO Server
Deploy separately or use Vercel Serverless Functions.

---

## 📝 API Reference

### Database Helpers

```typescript
// Q&A
submitQAQuestion(params)
upvoteQuestion(questionId, sessionId)
getTopQAQuestions(slideId, limit)
toggleQuestionAnswered(questionId)

//  Responses
submitResponse(params)
getSlideResponses(slideId)

// Presentations
createPresentation(params)
getPresentationByCode(code)
updateSlide(slideId, updates)

// Analytics
getPresentationAnalytics(presentationId)
trackAnalyticsEvent(params)

// Utilities
generateUniquePresentationCode()
isPresentationCodeAvailable(code)
```

### Real-time Subscriptions

```typescript
// Subscribe to Q&A
const subscription = subscribeToQAQuestions(slideId, (question) => {
  console.log('New question:', question)
})

// Subscribe to responses
subscribeToResponses(slideId, (response) => {
  console.log('New response:', response)
})

// Cleanup
subscription.unsubscribe()
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```typescript
// Check credentials
import { checkCredentials } from '@/lib/utils/db-connection'
const { valid, missing } = checkCredentials()

// Verify connection
import { dbConnection } from '@/lib/utils/db-connection'
const status = await dbConnection.verifyWithRetry(3)
```

### Common Errors

**"Cannot connect to database"**
- Check `.env.local` has correct Supabase URL and keys
- Verify database migration ran successfully
- Check Supabase project is active

**"Table does not exist"**
- Run database migration: `migrations/001_*.sql`
- Verify in Supabase SQL Editor

**"TypeScript errors in database-helpers.ts"**
- Normal until database is migrated
- Run migration to fix

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Centralized config (no hardcoded text)
- Comprehensive error handling
- Accessibility (ARIA labels)

---

## 📄 License

MIT License - see LICENSE file

---

## 🙋 Support

- **Documentation**: This README
- **Issues**: GitHub Issues
- **Email**: support@questify.app

---

## 🎉 What's New in v2.0

- ✨ Complete UI redesign
- 🎨 Data-driven architecture
- 🛠️ Comprehensive error handling
- 🔌 Database connection verification
- 📊 6 new question types
- 📈 Analytics dashboard
- 🎯 Centralized configuration
- ♿ Accessibility improvements
- 🚀 Performance optimizations

---

**Built with ❤️ for better presentations**

© 2026 Questify. All rights reserved.