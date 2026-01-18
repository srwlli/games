# Game State Management Review

## Current State

### Shared Hook: `useGameState`
**Location:** `hooks/use-game-state.ts`

**States Available:**
- `"idle"` - Game not started
- `"playing"` - Game is active
- `"paused"` - Game is paused
- `"gameOver"` - Game has ended

**API:**
```typescript
const {
  state,           // Current state string
  isPlaying,       // boolean: state === "playing"
  isPaused,        // boolean: state === "paused"
  isGameOver,      // boolean: state === "gameOver"
  start,           // () => void - transitions to "playing"
  pause,           // () => void - transitions to "paused"
  resume,          // () => void - transitions to "playing"
  gameOver,        // () => void - transitions to "gameOver"
  reset,           // () => void - transitions to "idle"
} = useGameState({
  initialState?: GameState,  // Default: "playing"
  onStart?: () => void,
  onPause?: () => void,
  onResume?: () => void,
  onGameOver?: () => void,
  onReset?: () => void,
})
```

---

## Game-by-Game Analysis

### 1. **Tetris** (`components/games/tetris.tsx`)
- **Initial State:** `"idle"`
- **Start Behavior:** Requires explicit `start()` call (via "Start" button)
- **Pause Support:** ✅ Yes (P key or button)
- **Reset Behavior:** Calls `reset()` then `start()` immediately
- **Notes:** Fully integrated with pause/resume functionality

### 2. **Reflex Tapper** (`components/games/reflex-tapper.tsx`)
- **Initial State:** `"idle"`
- **Start Behavior:** Requires explicit `start()` call (via "Start Game" button)
- **Pause Support:** ✅ Yes (P key or button)
- **Reset Behavior:** Calls `reset()` (returns to idle, requires start button)
- **Notes:** Has pre-round countdown (3..2..1..) before game actually starts

### 3. **Pick Up Sticks** (`components/games/pick-up-sticks.tsx`)
- **Initial State:** `"playing"` ⚠️
- **Start Behavior:** Starts immediately on mount
- **Pause Support:** ❌ No (has pause/resume functions but not used in UI)
- **Reset Behavior:** Calls `reset()` then `start()` immediately
- **Notes:** No pause button in UI, but hook supports it

### 4. **Memory Match** (`components/games/memory-match.tsx`)
- **Initial State:** `"playing"` ⚠️
- **Start Behavior:** Starts immediately on mount
- **Pause Support:** ❌ No (has pause/resume functions but not used in UI)
- **Reset Behavior:** Calls `reset()` then `start()` immediately
- **Notes:** Auto-initializes game on mount

### 5. **Fishing** (`components/games/fishing.tsx`)
- **Initial State:** `"idle"`
- **Start Behavior:** Requires pattern selection to start
- **Pause Support:** ✅ Yes (P key or button)
- **Reset Behavior:** Calls `reset()` then `start()` immediately
- **Notes:** Has pattern selection screen before game starts

---

## Issues & Inconsistencies

### ❌ **No Global Game State**
- Each game manages its own state independently
- No cross-game state management
- No unified "game session" concept

### ⚠️ **Inconsistent Initial States**
- **Games starting in `"idle"`:** Tetris, Reflex Tapper, Fishing
- **Games starting in `"playing"`:** Pick Up Sticks, Memory Match
- This creates different UX patterns:
  - Some games require a "Start" button
  - Others start immediately

### ⚠️ **Inconsistent Pause Support**
- **Full pause support:** Tetris, Reflex Tapper, Fishing
- **Hook available but not used:** Pick Up Sticks, Memory Match

### ⚠️ **Inconsistent Reset Behavior**
- Some games call `reset()` then `start()` (auto-restart)
- Others just call `reset()` (requires manual start)

---

## Recommendations

### Option 1: Standardize Initial State
**Make all games start in `"idle"`** and require explicit start:
- ✅ Consistent UX across all games
- ✅ Allows for "How to Play" screens before starting
- ✅ Better for games with countdowns/pre-game setup
- ❌ Requires adding start buttons to Pick Up Sticks and Memory Match

### Option 2: Create Global Game Session State
**Add a context/provider for game sessions:**
```typescript
// hooks/use-game-session.ts
interface GameSession {
  currentGame: string | null
  isInGame: boolean
  startGame: (gameId: string) => void
  endGame: () => void
}
```
- ✅ Could enable cross-game features (leaderboards, achievements)
- ✅ Better analytics tracking
- ❌ More complexity, may be overkill

### Option 3: Keep Current Approach (Document Standards)
**Document best practices:**
- Games with setup/countdowns → `initialState: "idle"`
- Games that start immediately → `initialState: "playing"`
- All games should support pause (even if not in UI initially)

---

## Current Games Registry

From `lib/games-registry.tsx`:
1. **pick-up-sticks** - Mini-Game
2. **memory-match** - Brain Game
3. **reflex-tapper** - Action
4. **tetris** - Puzzle
5. **fishing** - Action

All games use the shared `useGameState` hook, but with different patterns.

---

## Global Game Session Manager ✅

**Status:** Implemented

### Overview
A global game session manager tracks all game sessions across the platform, enabling:
- Cross-game analytics
- Session history tracking
- Best score tracking per game
- Total play time statistics
- Future features: leaderboards, achievements, streaks

### Implementation

**Location:** `contexts/game-session-context.tsx`

**Provider:** Wrapped in `app/layout.tsx` (available app-wide)

**Auto-tracking:** `app/games/[slug]/game-client.tsx` automatically:
- Starts a session when a game mounts
- Ends the session when the user exits

### API

#### `useGameSession()` Hook

```typescript
const {
  // Current session state
  currentGame,        // GameId | null
  isInGame,          // boolean
  currentSession,     // GameSession | null
  sessionHistory,    // GameSession[]

  // Session management
  startSession,      // (gameId, metadata?) => void
  endSession,        // (score?, metadata?) => void
  updateSession,     // (updates) => void

  // Analytics
  getTotalGamesPlayed,    // () => number
  getGamesPlayedFor,      // (gameId) => number
  getBestScoreFor,        // (gameId) => number | null
  getTotalPlayTime,       // () => number (ms)
} = useGameSession()
```

#### `useGameSessionIntegration()` Helper Hook

**Location:** `hooks/use-game-session-integration.ts`

Simplified integration for games:

```typescript
const { updateScore, endGameSession, updateMetadata } = useGameSessionIntegration('reflex-tapper')

// Update score during gameplay
useEffect(() => {
  updateScore(score)
}, [score])

// End session with final score and metadata
const handleGameOver = () => {
  endGameSession(score, { 
    mode: gameMode,
    streak: streak.current,
    avgReactionTime: calculateAvgReactionTime()
  })
}
```

### Session Data Structure

```typescript
interface GameSession {
  gameId: GameId
  startTime: number | null
  endTime: number | null
  score: number | null
  metadata: Record<string, unknown>  // Custom game data
}
```

### Persistence

- Session history is automatically saved to `localStorage`
- Last 100 sessions are kept
- Persists across page refreshes

### Usage Examples

#### Example 1: Basic Score Tracking
```typescript
// In your game component
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"

export default function MyGame() {
  const [score, setScore] = useState(0)
  const { updateScore, endGameSession } = useGameSessionIntegration('my-game')

  // Update score in real-time
  useEffect(() => {
    updateScore(score)
  }, [score, updateScore])

  // End session on game over
  const handleGameOver = () => {
    endGameSession(score)
  }
}
```

#### Example 2: Advanced Metadata Tracking
```typescript
const { updateScore, updateMetadata, endGameSession } = useGameSessionIntegration('tetris')

// Track level changes
useEffect(() => {
  updateMetadata({ level: currentLevel })
}, [currentLevel])

// Track power-ups used
const usePowerUp = () => {
  updateMetadata({ 
    powerUpsUsed: (currentSession?.metadata.powerUpsUsed || 0) + 1 
  })
}

// End with comprehensive data
const handleGameOver = () => {
  endGameSession(score, {
    level: currentLevel,
    lines: clearedLines,
    timePlayed: elapsedTime,
    powerUpsUsed: powerUpsUsed
  })
}
```

#### Example 3: Analytics Dashboard
```typescript
import { useGameSession } from "@/hooks/use-game-session"

export default function AnalyticsDashboard() {
  const { 
    getTotalGamesPlayed, 
    getGamesPlayedFor, 
    getBestScoreFor,
    getTotalPlayTime 
  } = useGameSession()

  return (
    <div>
      <p>Total Games: {getTotalGamesPlayed()}</p>
      <p>Tetris Games: {getGamesPlayedFor('tetris')}</p>
      <p>Best Tetris Score: {getBestScoreFor('tetris')}</p>
      <p>Total Play Time: {Math.floor(getTotalPlayTime() / 1000 / 60)} minutes</p>
    </div>
  )
}
```

### Integration Status

- ✅ **Session Manager:** Implemented and active
- ✅ **Auto-tracking:** Games automatically tracked when mounted
- ⚠️ **Score Tracking:** Optional - games can integrate for score tracking
- ⚠️ **Metadata Tracking:** Optional - games can add custom metadata

### Future Enhancements

- [ ] Leaderboards (cross-game and per-game)
- [ ] Achievements system
- [ ] Daily/weekly challenges
- [ ] Streak tracking across games
- [ ] Export session history
- [ ] Cloud sync (if user accounts added)
