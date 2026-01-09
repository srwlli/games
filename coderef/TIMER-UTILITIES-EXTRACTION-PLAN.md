---
name: Timer Utilities Extraction
overview: Extract timer and interval logic from game components into reusable hooks (useInterval, useCountdown, useDelayedAction) to achieve separation of concerns. This keeps game components focused on game logic while timing mechanics are handled separately.
todos:
  - id: create-use-interval
    content: Create hooks/use-interval.ts with proper cleanup and pause/resume support
    status: pending
  - id: create-use-countdown
    content: Create hooks/use-countdown.ts with onComplete callback and pause/resume support
    status: pending
  - id: create-use-delayed-action
    content: Create hooks/use-delayed-action.ts for one-time delayed actions
    status: pending
  - id: migrate-reflex-tapper
    content: Migrate Reflex Tapper to use timer hooks (spawn interval, countdown, target lifetime)
    status: pending
    dependencies:
      - create-use-interval
      - create-use-countdown
      - create-use-delayed-action
  - id: migrate-tetris
    content: Migrate Tetris to use timer hooks (game loop, level up delay, lock delay)
    status: pending
    dependencies:
      - create-use-interval
      - create-use-delayed-action
  - id: migrate-memory-match
    content: Migrate Memory Match to use useDelayedAction for match delay
    status: pending
    dependencies:
      - create-use-delayed-action
  - id: migrate-pick-up-sticks
    content: Migrate Pick Up Sticks to use useDelayedAction for level up delay
    status: pending
    dependencies:
      - create-use-delayed-action
  - id: verify-no-direct-timers
    content: Verify no setInterval/setTimeout calls remain in game components
    status: pending
    dependencies:
      - migrate-reflex-tapper
      - migrate-tetris
      - migrate-memory-match
      - migrate-pick-up-sticks
  - id: test-all-games
    content: "Test all games: verify timers work, pause/resume works, no memory leaks"
    status: pending
    dependencies:
      - verify-no-direct-timers
---

# Timer and Interval Utilities Extraction

## Goal
Extract all timing logic (`setInterval`, `setTimeout`) from game components into reusable hooks to achieve proper separation of concerns. Game components should focus on game logic (rules, scoring, movement), while timing mechanics are handled by dedicated hooks.

## Architecture

### Three Concerns (After Extraction)
1. **State Management** → `useGameState` hook (manages game status only)
2. **Timing Mechanics** → Timer hooks (manage when things happen)
3. **Game Logic** → Game components (manage what happens)

### Hooks to Create

#### 1. `hooks/use-interval.ts`
Reusable interval hook that:
- Handles `setInterval` with proper cleanup
- Automatically pauses/resumes based on `isActive` flag
- Uses `useRef` to store callback (prevents stale closures)
- Returns control functions (pause/resume/reset)

**API:**
```typescript
useInterval(callback: () => void, delay: number | null, isActive?: boolean)
```

**Usage:**
```typescript
useInterval(() => {
  spawnTarget() // Game logic stays in component
}, 800, isPlaying) // Automatically pauses when game pauses
```

#### 2. `hooks/use-countdown.ts`
Countdown timer hook that:
- Counts down from initial seconds
- Calls `onComplete` when reaching 0
- Pauses/resumes with game state
- Supports reset with optional new initial value

**API:**
```typescript
useCountdown(initialSeconds: number, onComplete?: () => void, isActive?: boolean)
```

**Usage:**
```typescript
const { timeLeft, reset: resetTimer } = useCountdown(20, () => gameOver(), isPlaying)
```

#### 3. `hooks/use-delayed-action.ts`
One-time delayed action hook that:
- Executes callback after delay
- Cancels if component unmounts or delay changes
- Supports conditional execution

**API:**
```typescript
useDelayedAction(callback: () => void, delay: number, condition?: boolean)
```

**Usage:**
```typescript
useDelayedAction(() => {
  setShowLevelUp(false) // Game logic
}, 2000, showLevelUp)
```

## Files to Create

1. **[hooks/use-interval.ts](hooks/use-interval.ts)** - Recurring interval hook
2. **[hooks/use-countdown.ts](hooks/use-countdown.ts)** - Countdown timer hook
3. **[hooks/use-delayed-action.ts](hooks/use-delayed-action.ts)** - One-time delay hook

## Files to Modify

### 1. [components/games/reflex-tapper.tsx](components/games/reflex-tapper.tsx)
**Current Issues:**
- `setInterval` for target spawning (line 19)
- `setTimeout` for target lifetime (line 27)
- `setTimeout` for countdown timer (line 37)

**Changes:**
- Replace spawn interval with `useInterval`
- Replace countdown with `useCountdown`
- Use `useDelayedAction` for target lifetime (or keep in spawn callback)

**Migration:**
```typescript
// Before
useEffect(() => {
  if (!isPlaying) return
  const spawnInterval = setInterval(() => { ... }, 800)
  return () => clearInterval(spawnInterval)
}, [isPlaying])

// After
useInterval(() => {
  const newTarget = { ... }
  setTargets((prev) => [...prev, newTarget])
  // Target lifetime handled separately
}, 800, isPlaying)
```

### 2. [components/games/tetris.tsx](components/games/tetris.tsx)
**Current Issues:**
- `setInterval` for game loop (line 370)
- `setTimeout` for level up animation (line 191)
- `setTimeout` for lock delay (line 255)

**Changes:**
- Replace game loop with `useInterval`
- Replace level up delay with `useDelayedAction`
- Replace lock delay with `useDelayedAction`

**Migration:**
```typescript
// Before
useEffect(() => {
  if (isPlaying) {
    gameLoopRef.current = setInterval(moveDown, fallSpeed)
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }
}, [moveDown, fallSpeed, isPlaying])

// After
useInterval(moveDown, fallSpeed, isPlaying)
```

### 3. [components/games/memory-match.tsx](components/games/memory-match.tsx)
**Current Issues:**
- `setTimeout` for match delay (line 52)

**Changes:**
- Replace match delay with `useDelayedAction`

**Migration:**
```typescript
// Before
setTimeout(() => {
  // Match logic
}, 800)

// After
useDelayedAction(() => {
  // Match logic
}, 800, flippedCards.length === 2)
```

### 4. [components/games/pick-up-sticks.tsx](components/games/pick-up-sticks.tsx)
**Current Issues:**
- `setTimeout` for level up delay (line 55)

**Changes:**
- Replace level up delay with `useDelayedAction`

## Implementation Details

### Critical Requirements

1. **Memoized Callbacks**: All hooks must use `useCallback` for returned functions to prevent unnecessary re-renders
2. **Proper Cleanup**: All timers must be cleaned up on unmount or when dependencies change
3. **Game State Integration**: Timer hooks should accept `isActive` parameter (typically `isPlaying` from `useGameState`) to pause/resume automatically
4. **Stable References**: Use `useRef` for callbacks in intervals to prevent stale closures
5. **Type Safety**: Full TypeScript support with proper types

### Hook Implementation Patterns

**useInterval:**
- Store callback in `useRef` to prevent stale closures
- Only run interval when `isActive === true` and `delay !== null`
- Clean up interval on unmount or when `isActive`/`delay` changes

**useCountdown:**
- Use `useState` for `timeLeft`
- Use `useEffect` with `setTimeout` that depends on `timeLeft` and `isActive`
- Call `onComplete` when `timeLeft === 0`
- Provide `reset` function to restart countdown

**useDelayedAction:**
- Use `useEffect` with `setTimeout`
- Only execute if `condition === true` (or always if condition not provided)
- Clean up timeout if condition changes or component unmounts

## Verification Plan

1. **Automated Checks:**
   - No `setInterval` or `setTimeout` calls in game components (grep search)
   - All timer hooks properly integrated with `useGameState`
   - No linting errors

2. **Manual Testing:**
   - **Reflex Tapper**: Verify targets spawn every 800ms, disappear after 1500ms, countdown works, pause/resume works
   - **Tetris**: Verify game loop runs at correct speed, level up animation shows, pause/resume works
   - **Memory Match**: Verify match delay works, pause/resume works
   - **Pick Up Sticks**: Verify level up delay works, pause/resume works

3. **Memory Leak Testing:**
   - Navigate between games multiple times
   - Pause/resume games repeatedly
   - Verify no console warnings about memory leaks

## Benefits

1. **Separation of Concerns**: Timing logic separated from game logic
2. **Reusability**: Timer hooks work for any game type (platformer, card game, etc.)
3. **Maintainability**: Single source of truth for timing patterns
4. **Testability**: Timer hooks can be tested independently
5. **Memory Safety**: Proper cleanup prevents memory leaks
6. **Consistency**: All games use same timing patterns

## Migration Order

**Prerequisites:**
- ✅ `useGameState` hook already implemented (provides `isPlaying` flag)

**Implementation Steps:**
1. Create all three timer hooks first (`useInterval`, `useCountdown`, `useDelayedAction`)
2. Migrate Reflex Tapper (most complex timer usage - spawn interval, countdown, target lifetime)
3. Migrate Tetris (game loop is critical - interval for piece falling, delays for animations)
4. Migrate Memory Match (simple delay - match delay)
5. Migrate Pick Up Sticks (simple delay - level up delay)
6. Verify all games work correctly
7. Remove any remaining direct timer calls

**Note:** All timer hooks will integrate with `useGameState` by accepting `isPlaying` as the `isActive` parameter, ensuring timers automatically pause/resume with game state.
