# Top 5 Architecture Improvements

**Analysis Date:** 2025-01-27  
**Scope:** Local games platform, refactoring for shared components and code reuse

---

## 1. Shared UI Component Library

### Current State
**Duplication Identified:**
- **StatsBar component** duplicated 4 times with identical styling:
  - `bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-2xl`
  - `text-xs text-zinc-500 uppercase font-bold tracking-wider` label pattern
  - Used in: Tetris (3 stats), Memory Match (1), Reflex Tapper (2), Pick Up Sticks (3)
  
- **GameOverModal component** duplicated 4 times with 95% identical structure:
  - Same overlay: `bg-black/80 backdrop-blur-md`
  - Same container: `bg-zinc-900 border-2 rounded-3xl p-10 text-center`
  - Same button: `bg-{color}-500 hover:bg-{color}-600` pattern
  - Only differences: title text, color accent, score display format

- **GameButton component** pattern repeated:
  - Similar button styles across reset/play again actions
  - Consistent hover states and transitions

### Impact
- **Lines of code reduction:** ~200+ lines eliminated
- **Maintenance burden:** Single source of truth for UI updates
- **Consistency:** Guaranteed visual consistency across games
- **Accessibility:** Centralized ARIA labels and keyboard navigation

### Implementation
```typescript
// components/games/shared/StatsBar.tsx
interface StatsBarProps {
  label: string
  value: string | number
  color?: 'emerald' | 'purple' | 'orange' | 'cyan' | 'amber' | 'white'
}

// components/games/shared/GameOverModal.tsx
interface GameOverModalProps {
  isOpen: boolean
  title: string
  subtitle?: string
  score?: number | string
  scoreLabel?: string
  accentColor: 'purple' | 'orange' | 'red' | 'emerald'
  onPlayAgain: () => void
}

// components/games/shared/GameButton.tsx
interface GameButtonProps {
  onClick: () => void
  variant: 'primary' | 'secondary'
  color?: string
  children: React.ReactNode
}
```

### Migration Path
1. Create shared components in `components/games/shared/`
2. Extract StatsBar first (lowest risk)
3. Extract GameOverModal (medium risk - verify all variants)
4. Update games one at a time
5. Remove duplicate code

---

## 2. Game State Management Hook

### Current State
**Common Patterns Identified:**
- **Game state enum:** `"playing" | "paused" | "gameOver"` (Tetris)
- **Active flag:** `gameActive: boolean` (Reflex Tapper, Pick Up Sticks)
- **Reset function:** All games have `resetGame()` or `handleRestart()` with similar logic
- **Pause functionality:** Tetris has pause, others don't but could benefit

### Impact
- **Code reduction:** ~50-100 lines per game
- **Consistency:** Standardized game lifecycle management
- **Features:** Easy to add pause/resume to all games
- **Testing:** Centralized state machine logic

### Implementation
```typescript
// hooks/useGameState.ts
type GameState = 'idle' | 'playing' | 'paused' | 'gameOver'

interface UseGameStateOptions {
  initialState?: GameState
  onGameOver?: () => void
  onPause?: () => void
  onResume?: () => void
}

export function useGameState(options?: UseGameStateOptions) {
  const [state, setState] = useState<GameState>(options?.initialState || 'idle')
  
  const start = useCallback(() => setState('playing'), [])
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
  const reset = useCallback(() => setState('idle'), [])
  
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

### Usage Example
```typescript
// Before (Tetris - 8 lines)
const [gameState, setGameState] = useState<GameState>("playing")
const togglePause = useCallback(() => {
  setGameState((prev) => (prev === "playing" ? "paused" : "playing"))
}, [])

// After (2 lines)
const { state: gameState, isPlaying, pause, resume, togglePause } = useGameState()
const togglePause = useCallback(() => isPlaying ? pause() : resume(), [isPlaying, pause, resume])
```

### Migration Path
1. Create hook with full test coverage
2. Migrate Tetris first (most complex state)
3. Migrate other games incrementally
4. Add pause functionality to games that don't have it

---

## 3. Timer and Interval Utilities

### Current State
**Duplication Identified:**
- **Countdown timer:** Reflex Tapper has manual `setTimeout` chain
- **Spawn interval:** Reflex Tapper uses `setInterval` with cleanup
- **Game loop:** Tetris uses `setInterval` with ref management
- **Delayed actions:** All games use `setTimeout` for delays (match check, level up, etc.)

**Common Issues:**
- Cleanup not always handled correctly
- Stale closures in timeout callbacks
- No pause/resume support for timers

### Impact
- **Reliability:** Proper cleanup prevents memory leaks
- **Features:** Pause/resume timers when game pauses
- **Consistency:** Standardized timing patterns
- **Testing:** Mockable timer utilities

### Implementation
```typescript
// hooks/useCountdown.ts
export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(true)
  
  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft === 0) onComplete?.()
      return
    }
    
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, isActive, onComplete])
  
  return {
    timeLeft,
    isActive,
    pause: () => setIsActive(false),
    resume: () => setIsActive(true),
    reset: (seconds?: number) => {
      setTimeLeft(seconds ?? initialSeconds)
      setIsActive(true)
    },
  }
}

// hooks/useInterval.ts
export function useInterval(callback: () => void, delay: number | null, isActive = true) {
  const savedCallback = useRef<() => void>()
  
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  
  useEffect(() => {
    if (!isActive || delay === null) return
    
    const id = setInterval(() => savedCallback.current?.(), delay)
    return () => clearInterval(id)
  }, [delay, isActive])
}

// hooks/useDelayedAction.ts
export function useDelayedAction() {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const schedule = useCallback((callback: () => void, delay: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(callback, delay)
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return { schedule, cancel: () => timeoutRef.current && clearTimeout(timeoutRef.current) }
}
```

### Usage Example
```typescript
// Before (Reflex Tapper - 8 lines)
useEffect(() => {
  if (timeLeft > 0 && gameActive) {
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  } else if (timeLeft === 0) {
    setGameActive(false)
  }
}, [timeLeft, gameActive])

// After (2 lines)
const { timeLeft, pause, resume } = useCountdown(20, () => setGameActive(false))
useEffect(() => {
  gameActive ? resume() : pause()
}, [gameActive, resume, pause])
```

### Migration Path
1. Create utilities with comprehensive tests
2. Migrate Reflex Tapper timer first (simplest)
3. Migrate Tetris game loop
4. Replace all `setTimeout` calls with `useDelayedAction`

---

## 4. Input Handling Abstraction

### Current State
**Duplication Identified:**
- **Keyboard handling:** Tetris has 30+ lines of key mapping logic
- **Touch gestures:** Tetris has custom swipe detection (50+ lines)
- **Click handling:** All games have similar `onClick` patterns
- **Event cleanup:** Each game manually manages `addEventListener`/`removeEventListener`

**Inconsistencies:**
- Tetris supports keyboard + touch, others only click
- No standardized key bindings
- Touch gesture thresholds hardcoded

### Impact
- **Accessibility:** Centralized keyboard navigation
- **Consistency:** Standardized controls across games
- **Features:** Easy to add keyboard support to click-only games
- **Maintainability:** Single source for input mapping

### Implementation
```typescript
// hooks/useKeyboardControls.ts
interface KeyboardControls {
  [key: string]: () => void
}

export function useKeyboardControls(controls: KeyboardControls, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const handler = controls[e.key] || controls[e.key.toLowerCase()]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [controls, enabled])
}

// hooks/useTouchGestures.ts
interface GestureConfig {
  onTap?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  tapThreshold?: number  // pixels
  swipeThreshold?: number  // pixels
  tapDuration?: number  // ms
}

export function useTouchGestures(config: GestureConfig) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }, [])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    
    const tapThreshold = config.tapThreshold ?? 30
    const swipeThreshold = config.swipeThreshold ?? 50
    const tapDuration = config.tapDuration ?? 200
    
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    if (absX < tapThreshold && absY < tapThreshold && deltaTime < tapDuration) {
      config.onTap?.()
    } else if (absX > absY && absX > swipeThreshold) {
      deltaX > 0 ? config.onSwipeRight?.() : config.onSwipeLeft?.()
    } else if (absY > absX && absY > swipeThreshold) {
      deltaY > 0 ? config.onSwipeDown?.() : config.onSwipeUp?.()
    }
    
    touchStartRef.current = null
  }, [config])
  
  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd }
}
```

### Usage Example
```typescript
// Before (Tetris - 30+ lines)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (gameState !== "playing") { /* ... */ }
    switch (e.key) {
      case "ArrowLeft": case "a": case "A":
        e.preventDefault()
        moveHorizontal(-1)
        break
      // ... 20+ more lines
    }
  }
  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [gameState, moveHorizontal, /* ... */])

// After (5 lines)
useKeyboardControls({
  ArrowLeft: () => moveHorizontal(-1),
  ArrowRight: () => moveHorizontal(1),
  ArrowDown: () => moveDown(),
  ArrowUp: () => handleRotate(),
  ' ': () => hardDrop(),
}, isPlaying)

const { onTouchStart, onTouchEnd } = useTouchGestures({
  onTap: handleRotate,
  onSwipeLeft: () => moveHorizontal(-1),
  onSwipeRight: () => moveHorizontal(1),
  onSwipeDown: hardDrop,
})
```

### Migration Path
1. Create hooks with default key bindings
2. Migrate Tetris first (most complex)
3. Add keyboard support to click-only games
4. Standardize gesture thresholds

---

## 5. Theme and Constants System

### Current State
**Duplication Identified:**
- **Color gradients:** Each game defines its own gradient classes
- **Spacing values:** Repeated `px-6 py-3`, `rounded-2xl`, etc.
- **Timing constants:** Hardcoded delays (800ms, 1500ms, 1000ms) scattered
- **Game-specific constants:** Board sizes, spawn rates, etc. not centralized

**Issues:**
- No single source of truth for design tokens
- Difficult to implement dark/light mode toggle
- Hard to maintain consistent spacing/colors

### Impact
- **Maintainability:** Single source for design decisions
- **Theming:** Easy to add theme variants
- **Consistency:** Guaranteed visual consistency
- **Configuration:** Centralized game balance tuning

### Implementation
```typescript
// lib/game-constants.ts
export const GAME_TIMING = {
  SPAWN_INTERVAL: 800,        // Reflex Tapper
  TARGET_LIFETIME: 1500,      // Reflex Tapper
  COUNTDOWN_INTERVAL: 1000,   // Reflex Tapper, Tetris
  MATCH_DELAY: 800,           // Memory Match
  LEVEL_UP_DELAY: 1500,       // Pick Up Sticks
  LEVEL_UP_ANIMATION: 2000,  // Tetris
} as const

export const GAME_DIMENSIONS = {
  TETRIS_BOARD_WIDTH: 10,
  TETRIS_BOARD_HEIGHT: 20,
  MEMORY_GRID_SIZE: 4,
  MEMORY_CARD_COUNT: 16,
  PICK_UP_STICKS_INITIAL: 12,
} as const

export const GAME_SCORING = {
  REFLEX_TAPPER_POINTS: 10,
  PICK_UP_STICKS_BASE: 50,
  TETRIS_SOFT_DROP: 1,
  TETRIS_HARD_DROP_MULTIPLIER: 2,
  TETRIS_LINE_SCORES: [100, 300, 500, 800],
} as const

// lib/game-theme.ts
export const GAME_THEME = {
  colors: {
    emerald: {
      primary: 'bg-emerald-500',
      hover: 'hover:bg-emerald-600',
      text: 'text-emerald-400',
      border: 'border-emerald-500',
    },
    purple: {
      primary: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      text: 'text-purple-400',
      border: 'border-purple-500',
    },
    orange: {
      primary: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      text: 'text-orange-400',
      border: 'border-orange-500',
    },
    // ... other colors
  },
  spacing: {
    statsBar: 'px-6 py-3',
    statsBarCompact: 'px-4 py-2',
    modal: 'p-10',
    button: 'py-4 px-8',
  },
  borderRadius: {
    card: 'rounded-2xl',
    modal: 'rounded-3xl',
    button: 'rounded-xl',
  },
  backdrop: {
    overlay: 'bg-black/80 backdrop-blur-md',
    stats: 'bg-zinc-900/90 backdrop-blur-sm',
  },
} as const

// Utility function
export function getGameTheme(gameId: string) {
  const themeMap: Record<string, keyof typeof GAME_THEME.colors> = {
    'pick-up-sticks': 'emerald',
    'memory-match': 'purple',
    'reflex-tapper': 'orange',
    'tetris': 'purple',
  }
  return GAME_THEME.colors[themeMap[gameId] || 'purple']
}
```

### Usage Example
```typescript
// Before (hardcoded values)
const spawnInterval = setInterval(() => {
  // ...
}, 800)

// After (centralized constant)
import { GAME_TIMING } from '@/lib/game-constants'
const spawnInterval = setInterval(() => {
  // ...
}, GAME_TIMING.SPAWN_INTERVAL)

// Before (hardcoded classes)
<button className="bg-purple-500 hover:bg-purple-600 text-white font-black py-4 px-8 rounded-xl">

// After (theme system)
import { GAME_THEME, getGameTheme } from '@/lib/game-theme'
const theme = getGameTheme('memory-match')
<button className={`${theme.primary} ${theme.hover} text-white font-black ${GAME_THEME.spacing.button} ${GAME_THEME.borderRadius.button}`}>
```

### Migration Path
1. Extract all hardcoded constants to `game-constants.ts`
2. Create theme system with color mappings
3. Replace hardcoded values incrementally
4. Add TypeScript types for type safety

---

## Implementation Priority

### Phase 1: Quick Wins (Week 1)
1. **Shared UI Components** - Highest impact, lowest risk
2. **Theme System** - Easy to implement, immediate consistency gains

### Phase 2: Core Infrastructure (Week 2)
3. **Game State Hook** - Foundation for future features
4. **Timer Utilities** - Prevents bugs, enables pause/resume

### Phase 3: Enhanced Features (Week 3)
5. **Input Handling** - Improves accessibility and consistency

---

## Expected Outcomes

### Code Metrics
- **Lines of code reduction:** ~500-700 lines eliminated
- **Component reuse:** 4 shared components used across all games
- **Maintainability:** Single source of truth for UI, state, timing, input

### Feature Improvements
- **Accessibility:** Keyboard navigation for all games
- **Consistency:** Unified UI/UX across platform
- **Pause/Resume:** Available for all games
- **Theming:** Easy to add dark/light mode or custom themes

### Developer Experience
- **Faster development:** New games can use shared components
- **Easier testing:** Centralized logic easier to test
- **Better documentation:** Shared components have single source of docs

---

## Risk Assessment

| Improvement | Risk Level | Mitigation |
|-------------|------------|------------|
| Shared UI Components | Low | Incremental migration, backward compatible |
| Game State Hook | Medium | Comprehensive testing, gradual adoption |
| Timer Utilities | Low | Well-tested utilities, clear API |
| Input Handling | Medium | Maintain game-specific flexibility |
| Theme System | Low | Non-breaking changes, gradual migration |

---

**Next Steps:**
1. Review and approve improvement priorities
2. Create implementation tickets for Phase 1
3. Set up shared component directory structure
4. Begin with StatsBar component extraction
