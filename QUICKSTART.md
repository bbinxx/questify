# 🎮 Questify - Quick Start Guide

## For Players

### Join a Game (3 Easy Steps!)

1. **Go to the join page**
   - Open: `http://localhost:3000/join`
   - Or click "Join Game" from home page

2. **Enter Game PIN**
   - Get PIN from the presenter's screen
   - Example: `482519`
   - Click "Next"

3. **Create Your Profile**
   - Enter your nickname
   - Pick an avatar emoji (🦁🦊🐼🐨🐯🐙🦄🐲)
   - Click "Ready!"

4. **Play!**
   - Wait for host to start
   - Answer as FAST as possible for bonus points
   - See results after each question
   - Check leaderboard for your rank

### Scoring
- **Base Points**: 500 for correct answer
- **Speed Bonus**: Up to +500 (faster = more points)
- **Streak Bonus**: Up to +500 (consecutive correct answers)
- **Maximum**: 1,500 points per question!

---

## For Hosts/Presenters

### Start a Game (2 Steps!)

1. **Open Presenter View**
   - Go to: `http://localhost:3000/present`
   - Share your screen with participants

2. **Share Game PIN**
   - PIN shown on screen (e.g., `482519`)
   - Tell players to go to `questify.app/join` or `localhost:3000/join`
   - Wait for players to join (you'll see floating avatars!)

3. **Start Game**
   - Click "Start Game" when ready
   - Game will auto-advance through phases
   - Click "Next" after each leaderboard
   - Click "End Game" to finish early

### Game Phases (Automatic)
1. **Reading** (5s) - Players read the question
2. **Answering** (10-15s) - Players submit answers
3. **Results** (5s) - Show correct answer
4. **Leaderboard** - Show top 10 players
5. Repeat until all questions done!

### Controls
- **Start Game** - Begin the quiz
- **Next** - Continue to next question (on leaderboard screen)
- **End Game** - Stop game early and show final results

---

## Troubleshooting

### "Game in progress" Error
**Fixed!** You can now join mid-game. Just refresh and try again.

### Ready Button Not Working
**Fixed!** Make sure:
- PIN is at least 4 characters
- Name is entered
- Look for 🟢 (connected) at bottom

### Can't See Questions
**Fixed!** Questions now appear during answering phase only.

### Leaderboard Shows Question
**Fixed!** Leaderboard now shows only scores and funny messages.

### Not Sure If Connected?
Look at bottom of form:
- 🟢 = Connected
- 🔴 = Disconnected (wait or refresh)

---

## Tips & Tricks

### For Players
- Answer QUICKLY for max points!
- Build a streak for bonus points
- Don't panic, you have time
- Watch for the countdown timer
- Check your rank on leaderboard

### For Hosts
- Test with 2-3 people first
- Share screen clearly
- Wait for all players to join
- Use "End Game" if needed
- Have fun with the funny leaderboard messages!

### Pro Tips
- Use full screen mode for better experience
- Mute notifications during game
- Use headphones for immersive experience
- Customize questions in `app/data/quiz.js`
- Adjust timings in `app/config/game.ts`

---

## Quick Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

---

## URLs

| Page | Local URL | Production |
|------|-----------|------------|
| Home | http://localhost:3000 | yourdomain.com |
| Join | http://localhost:3000/join | yourdomain.com/join |
| Present | http://localhost:3000/present | yourdomain.com/present |

---

## Game Stats

- Max Players: **100**
- Questions: **10** (customizable)
- Time per Question: **10-15 seconds**
- Points Range: **0 - 1,500**
- Leaderboard: **Top 10**
- Phases: **4** (Reading, Answering, Results, Leaderboard)

---

## Need Help?

1. Check server logs for errors
2. Look for console messages in browser (F12)
3. Verify connection status (🟢/🔴)
4. Read `BUGFIXES.md` for known issues
5. Check `DEPLOYMENT.md` for hosting issues

---

## What's Working

✅ Real-time multiplayer
✅ Floating animated avatars
✅ Live scoring with streaks
✅ Confetti effects
✅ Funny leaderboard messages
✅ Mobile responsive
✅ Auto game flow
✅ Late join support
✅ Rejoin capability
✅ Beautiful animations

---

**Have fun playing Questify! 🎮✨**

Report bugs or request features in `PROPOSED_FEATURES.md`
