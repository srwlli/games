# Implementation Plan: Game State Management Hook

Standardize game lifecycle states (`idle`, `playing`, `paused`, `gameOver`) across the platform using a shared custom hook.

## Proposed Changes

### Core Hooks
#### [NEW] [use-game-state.ts](file:///c:/Users/willh/Desktop/games/hooks/use-game-state.ts)
Create a centralized hook with the following interface:
- `state`: 'idle' | 'playing' | 'paused' | 'gameOver'
- `isPlaying`: boolean (derived from state === 'playing')
- `isPaused`: boolean (derived from state === 'paused')
- `isGameOver`: boolean (derived from state === 'gameOver')
- `start()`: Transitions to 'playing', calls `onStart` callback if provided
- `pause()`: Transitions to 'paused', calls `onPause` callback if provided
- `resume()`: Transitions to 'playing', calls `onResume` callback if provided
- `gameOver()`: Transitions to 'gameOver', calls `onGameOver` callback if provided
- `reset()`: Transitions to 'idle', calls `onReset` callback if provided

**Optional callbacks interface:**
```typescript
interface UseGameStateOptions {
  initialState?: 'idle' | 'playing' | 'paused' | 'gameOver'
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onGameOver?: () => void
  onReset?: () => void
}
```

**Timer Integration:**
- The hook's `isPlaying` boolean should be used by timer utilities (Improvement #3: `useCountdown`, `useInterval`)
- When `isPlaying` is false, timers should automatically pause
- When `isPlaying` becomes true, timers should automatically resume
- This coordination will be implemented when timer utilities are created

## Critical Implementation Details

After re-evaluating the component source code, three "must-haves" have been identified for the hook:

### 1. initialState Support
- **Requirement**: Both Tetris and Reflex Tapper start in the "playing" state immediately.
- **Implementation**: The hook should accept an optional `initialState` parameter defaulting to `'playing'`.
- **Rationale**: Avoids adding an extra "Start" click for the user - games begin immediately on mount.
- **Default**: `initialState: 'playing'` (games start automatically)

### 2. Memoized Callbacks
- **Requirement**: Game loops in Tetris and Reflex Tapper run inside `useEffect` with intervals.
- **Implementation**: All state-change functions (`pause`, `resume`, `gameOver`, `start`, `reset`) returned by the hook **must be wrapped in `useCallback`**.
- **Rationale**: Prevents game loops from accidentally restarting or flickering due to reference changes.
- **Critical**: Without memoization, `useEffect` dependencies will change on every render, causing intervals to restart.

### 3. Helper Booleans
- **Requirement**: Component code should be clean and readable.
- **Implementation**: Return convenient boolean flags: `isPlaying`, `isPaused`, `isGameOver`.
- **Rationale**: Makes component code much cleaner (e.g., `if (isPlaying)` instead of `if (state === 'playing')`).
- **Usage**: All game components should use these booleans for conditional logic and `useEffect` dependencies.

### Game Components
Refactor each game to replace manual boolean state with the new `useGameState` hook.

#### [MODIFY] [tetris.tsx](file:///c:/Users/willh/Desktop/games/components/games/tetris.tsx)
- Replace internal `gameState: "playing" | "paused" | "gameOver"` with `useGameState`.
- Map existing states: `"playing"` → `"playing"`, `"paused"` → `"paused"`, `"gameOver"` → `"gameOver"`.
- Initialize with `initialState: "playing"` (game starts immediately).
- Map keyboard controls (P/Escape) to `pause()` and `resume()` methods.
- Map game over condition to `gameOver()` method.
- Update game loop to check `isPlaying` instead of `gameState !== "playing"`.

#### [MODIFY] [reflex-tapper.tsx](file:///c:/Users/willh/Desktop/games/components/games/reflex-tapper.tsx)
- Replace `gameActive: boolean` with `useGameState`.
- Map `gameActive === true` → `isPlaying`, `gameActive === false` → `isGameOver`.
- Initialize with `initialState: "playing"`.
- Integrate pause functionality (currently missing) - add keyboard handler for P/Escape.
- **Timer Integration**: Update countdown timer to use `isPlaying` from hook (will coordinate with `useCountdown` in Improvement #3).
- When timer reaches 0, call `gameOver()` instead of `setGameActive(false)`.
- Update spawn interval to check `isPlaying` instead of `gameActive`.

#### [MODIFY] [pick-up-sticks.tsx](file:///c:/Users/willh/Desktop/games/components/games/pick-up-sticks.tsx)
- Replace `gameOver: boolean` state with `useGameState` (currently unused but sets up for future use).
- Initialize with `initialState: "playing"` (game starts immediately).
- The `gameOver` state is currently never set to `true` (infinite progression), but migration prepares for future game over conditions.
- Integrate pause functionality (currently missing) - add keyboard handler for P/Escape.
- Update any conditional checks from `if (gameOver)` to `if (isGameOver)`.

#### [MODIFY] [memory-match.tsx](file:///c:/Users/willh/Desktop/games/components/games/memory-match.tsx)
- Replace `gameWon: boolean` with `useGameState`.
- Map `gameWon === true` → `isGameOver`.
- Initialize with `initialState: "playing"`.
- When all cards matched, call `gameOver()` instead of `setGameWon(true)`.
- **Modal Display**: Update `GameOverModal` to show "Victory!" title when `isGameOver` is true (modal already supports custom titles via props).
- Integrate pause functionality (currently missing) - add keyboard handler for P/Escape.
- Update win condition check from `if (gameWon)` to `if (isGameOver)`.

## Considerations

### Timer Integration
- **Critical**: Ensure timers (e.g., Reflex Tapper's countdown, Tetris game loop) pause/resume correctly with game state.
- The hook exposes `isPlaying` boolean that timer utilities (Improvement #3) will use.
- Timer utilities (`useCountdown`, `useInterval`) should accept `isActive` prop that maps to `isPlaying`.
- When `isPlaying` becomes false, all active timers should pause.
- When `isPlaying` becomes true, all paused timers should resume from where they left off.

### Game-Specific Considerations

**Tetris:**
- Current state: `"playing" | "paused" | "gameOver"` - maps directly to hook states.
- Consider `idle` state for initial load (optional enhancement).
- Game loop interval must check `isPlaying` before executing `moveDown()`.

**Memory Match:**
- `gameWon` maps to `gameOver` state.
- Ensure `GameOverModal` displays "Victory!" title (already supported via props).
- No timers to pause, but pause functionality should prevent card clicks.

**Pick Up Sticks:**
- `gameOver` state currently unused (infinite progression).
- Migration sets up infrastructure for future game over conditions.
- No timers to pause, but pause functionality should prevent stick clicks.

**Reflex Tapper:**
- Most complex timer integration: countdown timer and spawn interval.
- Both must pause/resume with game state.
- Timer reaching 0 triggers `gameOver()` state.

### Implementation Details

**Hook Location:**
- Place in `hooks/use-game-state.ts` (not `components/games/shared/`) since it's a hook, not a component.
- Follows React hooks naming convention and separation of concerns.

**Optional Callbacks:**
- Support `onPause`, `onResume`, `onGameOver`, `onStart`, `onReset` callbacks for side effects.
- Allows games to perform custom actions on state transitions (e.g., save state, analytics).

**Integration with Timer Utilities:**
- Coordinate with `useCountdown` and `useInterval` (Improvement #3).
- Timer hooks should accept `isActive?: boolean` prop that maps to `isPlaying`.
- This creates a clean separation: game state controls timer execution.

**Code Example:**
```typescript
export function useGameState(options?: UseGameStateOptions) {
  const [state, setState] = useState<GameState>(options?.initialState ?? 'playing')
  
  // Memoized callbacks - CRITICAL for useEffect dependencies
  const start = useCallback(() => {
    setState('playing')
    options?.onStart?.()
  }, [options])
  
  const pause = useCallback(() => {
    setState('paused')
    options?.onPause?.()
  }, [options])
  
  const resume = useCallback(() => {
    setState('playing')
    options?.onResume?.()
  }, [options])
  
  const gameOver = useCallback(() => {
    setState('gameOver')
    options?.onGameOver?.()
  }, [options])
  
  const reset = useCallback(() => {
    setState('idle')
    options?.onReset?.()
  }, [options])
  
  return {
    state,
    isPlaying: state === 'playing',
    isPaused: state === 'paused',
    isGameOver: state === 'gameOver',
    start,
    pause,
    resume,
    gameOver,
    reset,
  }
}
```

## Files to be Modified

To implement this change, we will need to touch the following 5 files:

1. **[NEW] hooks/use-game-state.ts**: The central logic hub.
2. **components/games/tetris.tsx**: The most complex migration.
3. **components/games/reflex-tapper.tsx**: Gains new "Pause" capabilities.
4. **components/games/pick-up-sticks.tsx**: Gains new "Pause" capabilities.
5. **components/games/memory-match.tsx**: Gains new "Pause" capabilities.

## Verification Plan

### Automated Tests
- Verify that standard React lifecycle (useEffect cleanup) works correctly when pausing/resuming via the hook.
- Check for state conflicts in the Browser console during rapid state transitions.
- Test that optional callbacks fire at correct state transitions.
- Verify that `isPlaying`, `isPaused`, `isGameOver` boolean flags are correctly derived.
- **Critical**: Verify that memoized callbacks maintain stable references (no unnecessary re-renders or interval restarts).

### Manual Verification
- Play each game and test the **Pause/Resume** button (or 'P' key).
- **Critical**: Ensure that timers (e.g., in Reflex Tapper) stop exactly when paused and restart when resumed.
- Verify that the "Game Over" screen correctly triggers on win/loss conditions.
- Test Memory Match victory modal shows "Victory!" title correctly.
- Verify Tetris game loop stops when paused and resumes correctly.
- Test rapid pause/resume transitions for race conditions.
- Verify all keyboard controls (P/Escape) work consistently across games.
