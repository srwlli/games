# Game Start Flow Standard - Analysis & Recommendations

## Current State Analysis

### Shared Infrastructure
**`useGameState` Hook** (`hooks/use-game-state.ts`)
- ✅ Provides consistent state management: `idle`, `playing`, `paused`, `gameOver`
- ⚠️ **Issue**: Default `initialState` is `"playing"` (line 17), but most games override to `"idle"`
- ✅ Provides callbacks: `start()`, `pause()`, `resume()`, `gameOver()`, `reset()`
- ✅ Memoized boolean flags: `isPlaying`, `isPaused`, `isGameOver`

---

## Game-by-Game Current Implementation

### Classic Games

#### 1. **Tetris** (`components/games/tetris.tsx`)
**Current Flow:**
- ✅ Initial State: `"idle"`
- ✅ Start Screen: Full-screen modal with title, description, controls, and "START GAME" button
- ✅ Start Action: User clicks button → calls `start()` → transitions to `"playing"`
- ✅ Reset Behavior: `reset()` → `start()` (auto-restarts)
- ✅ Pause Support: Full pause/resume with overlay
- **Pattern**: **EXPLICIT START** (user must click button)

#### 2. **Memory Match** (`components/games/memory-match.tsx`)
**Current Flow:**
- ⚠️ Initial State: `"playing"` (line 17)
- ⚠️ Start Screen: **NONE** - auto-starts on mount (line 37-39)
- ⚠️ Start Action: `initializeGame()` called in `useEffect` → auto-calls `start()`
- ✅ Reset Behavior: `reset()` → `start()` (auto-restarts)
- ✅ Pause Support: Keyboard handler exists but no UI button
- **Pattern**: **AUTO-START** (no user interaction required)

---

### Word Games

#### 3. **Boggle** (`components/games/boggle.tsx`)
**Current Flow:**
- ✅ Initial State: `"idle"`
- ✅ Start Screen: Shows title, time mode selection (1min, 1.5min, 2min, 3min), and "Start Game" button
- ✅ Start Action: User selects time mode → clicks "Start Game" → calls `startGame()` → `start()`
- ✅ Reset Behavior: `reset()` → requires manual `startGame()` call
- ✅ Pause Support: Full pause/resume with overlay
- **Pattern**: **EXPLICIT START WITH OPTIONS** (user selects time mode, then clicks button)

#### 4. **Wordle** (`components/games/wordle.tsx`)
**Current Flow:**
- ✅ Initial State: `"idle"`
- ⚠️ Start Screen: Shows title, description, and "Start Game" button (line 353-364)
- ⚠️ **Issue**: Auto-starts after dictionary loads (line 44-46) - bypasses start screen
- ✅ Start Action: User clicks "Start Game" → calls `startGame()` → `start()`
- ✅ Reset Behavior: `reset()` → requires manual `startGame()` call
- ✅ Pause Support: Full pause/resume with overlay
- **Pattern**: **MIXED** (has start screen but auto-starts on mount)

---

### Reflex Game

#### 5. **Reflex Tapper** (`components/games/reflex-tapper.tsx`)
**Current Flow:**
- ✅ Initial State: `"idle"`
- ✅ Start Screen: Shows game mode selection, "How to Play", stats, and "Start Game" button
- ✅ Start Action: User selects mode → clicks "Start Game" → calls `startGame()` → `start()` → **countdown (3..2..1..)** → actual game starts
- ✅ Reset Behavior: `reset()` → requires manual `startGame()` call
- ✅ Pause Support: Full pause/resume with overlay
- ✅ **Special Feature**: Pre-round countdown (3..2..1..) before gameplay
- **Pattern**: **EXPLICIT START WITH COUNTDOWN** (user clicks button, then countdown, then game)

---

## Issues & Inconsistencies

### ❌ **1. Inconsistent Initial States**
- **Games starting in `"idle"`**: Tetris, Boggle, Wordle, Reflex Tapper ✅
- **Games starting in `"playing"`**: Memory Match ⚠️
- **Impact**: Memory Match auto-starts without user consent, breaking consistency

### ❌ **2. Auto-Start Behavior**
- **Wordle**: Has start screen but auto-starts after dictionary loads (line 44-46)
- **Memory Match**: No start screen, auto-starts on mount
- **Impact**: Users may not see start screens or have time to read instructions

### ❌ **3. Start Screen Variations**
- **Tetris**: Full-screen modal with controls info
- **Boggle**: Inline screen with time mode selection
- **Wordle**: Inline screen (but bypassed by auto-start)
- **Reflex Tapper**: Full-screen with mode selection, stats, and instructions
- **Memory Match**: No start screen
- **Impact**: Inconsistent UX patterns across games

### ❌ **4. Reset Behavior**
- **Auto-restart**: Tetris, Memory Match (call `reset()` then `start()`)
- **Manual restart**: Boggle, Wordle, Reflex Tapper (call `reset()`, user must click start)
- **Impact**: Some games restart immediately, others require user action

### ⚠️ **5. Optional Features Not Standardized**
- **Countdown**: Only Reflex Tapper has pre-round countdown
- **Mode Selection**: Boggle (time mode), Reflex Tapper (game mode)
- **Instructions**: Some games show controls, others don't

---

## Recommended Standard Game Start Flow

### **Standard Flow Pattern**

```
1. Component Mounts
   └─> State: "idle"
   └─> Show: Start Screen (with optional pre-game setup)

2. User Interaction
   └─> User selects options (if any)
   └─> User clicks "Start Game" button

3. Start Sequence
   └─> Call: start() → State: "playing"
   └─> Optional: Countdown (3..2..1..) if game requires it
   └─> Initialize: Game state, timers, etc.
   └─> Begin: Actual gameplay

4. Game Over
   └─> Call: gameOver() → State: "gameOver"
   └─> Show: Game Over Modal

5. Reset
   └─> Call: reset() → State: "idle"
   └─> Show: Start Screen again
   └─> User must click "Start Game" again (no auto-restart)
```

---

## Standard Requirements

### ✅ **1. Consistent Initial State**
- **ALL games MUST start in `"idle"`**
- Change `useGameState` default from `"playing"` to `"idle"`
- Remove any auto-start logic from `useEffect` hooks

### ✅ **2. Mandatory Start Screen**
- **ALL games MUST show a start screen when `state === "idle"`**
- Start screen should include:
  - Game title
  - Brief description or instructions
  - "Start Game" button (prominent, accessible)
  - Optional: Controls/keyboard shortcuts
  - Optional: Game mode/options selection

### ✅ **3. Explicit Start Action**
- **NO auto-start on mount**
- **NO auto-start after async operations** (e.g., dictionary loading)
- User MUST click "Start Game" button to begin
- Button should be clearly visible and accessible

### ✅ **4. Optional Countdown**
- Games can optionally show countdown (3..2..1..) after `start()` is called
- Countdown should happen AFTER state transitions to `"playing"` but BEFORE gameplay begins
- Use a ref to track countdown state to prevent re-triggering

### ✅ **5. Consistent Reset Behavior**
- **ALL games should require manual restart** (no auto-restart)
- `reset()` → `"idle"` → show start screen → user clicks "Start Game"
- This gives users time to review results before starting again

### ✅ **6. Start Screen UI Patterns**

**Option A: Full-Screen Modal** (Recommended for games with setup)
- Use `AnimatePresence` with overlay
- Center content in modal
- Include all options/instructions
- Examples: Tetris, Reflex Tapper

**Option B: Inline Screen** (For simpler games)
- Show start screen in main game area
- Less intrusive, faster to start
- Examples: Boggle, Wordle

**Recommendation**: Use **Option A** (full-screen modal) for consistency

---

## Implementation Plan

### Phase 1: Fix Inconsistencies

1. **Update `useGameState` default**
   ```typescript
   // Change line 17 in hooks/use-game-state.ts
   const [state, setState] = useState<GameState>(options?.initialState ?? "idle")
   ```

2. **Fix Memory Match**
   - Change `initialState: "playing"` → `initialState: "idle"`
   - Remove auto-start `useEffect` (line 37-39)
   - Add start screen with "Start Game" button

3. **Fix Wordle**
   - Remove auto-start after dictionary loads (line 44-46)
   - Keep start screen visible until user clicks "Start Game"

### Phase 2: Standardize Start Screens

4. **Create Shared Start Screen Component**
   - `components/games/shared/start-screen.tsx`
   - Props: `title`, `description`, `onStart`, `children` (for options)
   - Consistent styling and animations

5. **Update All Games to Use Shared Component**
   - Tetris: Already has good pattern, can refactor to shared component
   - Boggle: Convert inline screen to full-screen modal
   - Wordle: Convert inline screen to full-screen modal
   - Reflex Tapper: Already has good pattern, can refactor to shared component
   - Memory Match: Add start screen using shared component

### Phase 3: Standardize Reset Behavior

6. **Update Reset Logic**
   - Remove auto-restart patterns (`reset()` → `start()`)
   - All games should call `reset()` only
   - User must click "Start Game" again

---

## Code Examples

### Standard Start Screen Component

```typescript
// components/games/shared/start-screen.tsx
interface StartScreenProps {
  title: string
  description?: string
  onStart: () => void
  children?: React.ReactNode // For options/mode selection
  controls?: string[] // Keyboard shortcuts to display
}

export function StartScreen({ title, description, onStart, children, controls }: StartScreenProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-zinc-900 border-2 border-emerald-500/50 rounded-3xl p-8 max-w-md w-full mx-4"
        >
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter text-center">
            {title}
          </h2>
          {description && (
            <p className="text-zinc-400 mb-6 text-center">{description}</p>
          )}
          
          {children}
          
          <button
            onClick={onStart}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all mb-6 shadow-lg shadow-emerald-500/20"
            autoFocus
          >
            START GAME
          </button>
          
          {controls && controls.length > 0 && (
            <>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold border-t border-zinc-800 pt-6">
                Controls
              </div>
              <div className="mt-2 text-xs text-zinc-400 space-y-1">
                {controls.map((control, i) => (
                  <div key={i}>{control}</div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
```

### Standard Game Start Pattern

```typescript
export default function MyGame() {
  const { isPlaying, isPaused, isGameOver, start, pause, resume, gameOver, reset } = useGameState({
    initialState: "idle", // Always "idle"
  })

  // Initialize game data (async operations)
  useEffect(() => {
    const init = async () => {
      // Load dictionaries, generate boards, etc.
      // DO NOT call start() here
    }
    init()
  }, [])

  // Start game function
  const startGame = useCallback(() => {
    // Initialize game state
    // Reset timers
    // Generate new board/word/etc.
    start() // Transition to "playing"
    // Optional: Trigger countdown here if needed
  }, [start])

  // Reset game function
  const handleReset = useCallback(() => {
    reset() // Transition to "idle"
    // DO NOT call start() - user must click button again
  }, [reset])

  return (
    <div>
      {/* Start Screen - shown when state === "idle" */}
      {!isPlaying && !isGameOver && (
        <StartScreen
          title="My Game"
          description="Description here"
          onStart={startGame}
          controls={["Arrow keys to move", "P to pause"]}
        >
          {/* Optional: Mode selection, options, etc. */}
        </StartScreen>
      )}

      {/* Game content - shown when state === "playing" */}
      {isPlaying && (
        // Game UI
      )}

      {/* Pause overlay */}
      {isPaused && (
        // Pause UI
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        onPlayAgain={handleReset}
      />
    </div>
  )
}
```

---

## Summary

### Current State
- ✅ 4/5 games use `"idle"` initial state
- ⚠️ 2/5 games have auto-start behavior
- ⚠️ Inconsistent start screen patterns
- ⚠️ Mixed reset behaviors

### Target State
- ✅ ALL games start in `"idle"`
- ✅ ALL games require explicit start (no auto-start)
- ✅ ALL games show consistent start screen
- ✅ ALL games require manual restart (no auto-restart)
- ✅ Optional countdown standardized
- ✅ Shared start screen component

### Priority
1. **High**: Fix Memory Match and Wordle auto-start
2. **Medium**: Create shared start screen component
3. **Medium**: Standardize reset behavior
4. **Low**: Add optional countdown to games that would benefit
