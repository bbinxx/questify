# 🎮 Questify - Interactive Quiz Game Platform

A beautiful, real-time multiplayer quiz game built with Next.js and Socket.IO. Create engaging quiz experiences with floating avatars, live scoring, and stunning visual effects.

![Questify Banner](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-green?style=for-the-badge&logo=socket.io)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)

## ✨ Features

- 🎯 **Real-Time Multiplayer** - Up to 100 players per game
- 🎨 **Beautiful UI** - Modern design with glassmorphism and smooth animations
- 🔥 **Floating Avatars** - Dynamic physics-based player representations
- 📊 **Live Leaderboard** - Real-time score tracking with podium view
- 🎭 **Funny Messages** - Random witty phrases during leaderboard phases
- ⚡ **Optimized Performance** - useMemo, useCallback, and efficient state management
- 🌊 **Particle Effects** - Confetti for winners, rain for losers
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🎵 **Game Phases** - Reading, Answering, Results, and Leaderboard phases
- 🏆 **Streaks & Bonuses** - Reward consecutive correct answers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd questify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Home: `http://localhost:3000`
   - Presenter View: `http://localhost:3000/present`
   - Join Game: `http://localhost:3000/join`

## 🎮 How to Play

### For Hosts (Presenters)

1. Go to `/present`
2. Share the **Game PIN** (e.g., 482519) with participants
3. Wait for players to join (you'll see their floating avatars!)
4. Click **"Start Game"** when ready
5. Questions will advance through phases automatically:
   - **Reading Phase** (5s) - Preview question
   - **Answering Phase** (10-15s) - Players answer
   - **Results Phase** (5s) - Show correct answer
   - **Leaderboard** - Show top 5 players
6. Click **"Next"** to continue or **"End Game"** to finish

### For Players (Participants)

1. Go to `/join`
2. Enter the **Game PIN**
3. Create your profile (name + avatar)
4. Click **"Ready!"** to join
5. Answer questions as fast as possible for bonus points!
6. See your results and final ranking

## 🏗️ Project Structure

```
questify/
├── app/
│   ├── components/
│   │   └── game/
│   │       ├── AnswerGrid.tsx    # Answer options grid
│   │       └── QuestionCard.tsx  # Question display
│   ├── config/
│   │   └── game.ts               # Game configuration
│   ├── data/
│   │   └── quiz.js               # Quiz questions
│   ├── join/
│   │   └── page.tsx              # Participant view
│   ├── present/
│   │   └── page.tsx              # Presenter view
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── server.js                     # Socket.IO server
├── package.json
└── README.md
```

## ⚙️ Configuration

### Game Settings (`app/config/game.ts`)

```typescript
export const GAME_CONFIG = {
    TIMERS: {
        READING_PHASE: 5,      // seconds
        ANSWERING_PHASE: 15,   // seconds
        RESULT_PHASE: 5        // seconds
    },
    SCORING: {
        BASE_POINTS: 500,
        MAX_TIME_BONUS: 500,
        STREAK_BONUS: 100,
        MAX_STREAK_BONUS: 500
    },
    FLOATING: {
        MIN_SIZE: 80,          // pixels
        MAX_SIZE: 150,         // pixels
        MIN_SPEED: 0.3,        // pixels/frame
        MAX_SPEED: 1.5         // pixels/frame
    }
}
```

### Server Config (`server.js`)

```javascript
const FLOATING_CONFIG = {
    MIN_SIZE: 80,
    MAX_SIZE: 150,
    MIN_SPEED: 0.3,
    MAX_SPEED: 1.5
}
```

## 🎨 Customization

### Adding Questions

Edit `app/data/quiz.js`:

```javascript
{
    id: 'q11',
    question: "Your question here?",
    time: 15,
    answers: [
        { text: "Option 1", color: "bg-rose-500", icon: "△", correct: true },
        { text: "Option 2", color: "bg-blue-500", icon: "◇" },
        { text: "Option 3", color: "bg-amber-500", icon: "○" },
        { text: "Option 4", color: "bg-emerald-500", icon: "□" }
    ]
}
```

### Changing Funny Messages

Edit `app/join/page.tsx` and update the `FUNNY_PHRASES` array.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Effects**: Canvas Confetti
- **Real-time**: Socket.IO
- **Dev Tools**: Nodemon (auto-restart)

## 📊 Scoring System

- **Base Points**: 500 points for correct answer
- **Speed Bonus**: Up to 500 points based on answer speed
- **Streak Bonus**: 100 points per consecutive correct (max 500)
- **Total Possible**: Up to 1,500 points per question

## 🐛 Debugging

The app includes extensive console logging:

**Client-side logs:**
- `✅ Connected to server`
- `🎮 Attempting to join game...`
- `📊 Game state: <state>`

**Server-side logs:**
- `🎮 Server received join-room`
- `✨ Creating new player`
- `📤 Emitting room-joined to client`

## 🚦 Development Scripts

```bash
# Run with auto-reload (recommended)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Next.js dev server only
npm run dev:next
```

## 🔧 Troubleshooting

### Port already in use
Change port in `server.js`:
```javascript
const port = 3001  // Change from 3000
```

### Players can't join
1. Check if server is running (`npm run dev`)
2. Verify game PIN matches
3. Check browser console for errors
4. Ensure Socket.IO connection (look for 🟢 indicator)

### Nodemon not restarting
Clear nodemon cache:
```bash
npx nodemon --cls server.js
```

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes!

## 🤝 Contributing

Contributions welcome! Check out `PROPOSED_FEATURES.md` for ideas.

## 🎯 Roadmap

See `PROPOSED_FEATURES.md` for planned features including:
- Battle Royale mode
- Custom themes
- Sound effects
- Question image support
- Power-ups
- And much more!

---

Built with ❤️ using Next.js & Socket.IO
