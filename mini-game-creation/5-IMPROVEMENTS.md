# Top 5 Architecture Improvements

**Analysis Date:** 2025-01-27  
**Scope:** Local games platform, refactoring for shared components and code reuse

---

## 1. Shared UI Component Library

**Impact:** Highest — eliminates ~200+ lines of duplicate code

**What to extract:**
- `StatsBar` component (duplicated 9 times across 4 games)
- `GameOverModal` component (95% identical, only color/text differs)
- `GameButton` component (consistent reset/play again buttons)

**Benefits:**
- Single source of truth for UI updates
- Guaranteed visual consistency
- Centralized accessibility improvements
- Faster development of new games

**Implementation:**
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
```

---

## 2. Game State Management Hook

**Impact:** High — ~50-100 lines per game, enables pause/resume

**What to create:**
- `useGameState()` hook managing `idle | playing | paused | gameOver`
- Standardized `start()`, `pause()`, `resume()`, `gameOver()`, `reset()` methods
- Automatic pause/resume integration

**Benefits:**
- Consistent game lifecycle across all games
- Easy to add pause functionality to games that don't have it
- Centralized state machine logic
- Better testability

**Implementation:**
```typescript
// hooks/useGameState.ts
type GameState = 'idle' | 'playing' | 'paused' | 'gameOver'

export function useGameState(options?: UseGameStateOptions) {
  const [state, setState] = useState<GameState>('idle')
  
  return {
    state,
    isPlaying: state === 'playing',
    isPaused: state === 'paused',
    isGameOver: state === 'gameOver',
    start: () => setState('playing'),
    pause: () => setState('paused'),
    resume: () => setState('playing'),
    gameOver: () => setState('gameOver'),
    reset: () => setState('idle'),
  }
}
```

---

## 3. Timer and Interval Utilities

**Impact:** High — prevents memory leaks, enables pause/resume timers

**What to create:**
- `useCountdown()` hook (replaces manual setTimeout chains)
- `useInterval()` hook (proper cleanup, pause support)
- `useDelayedAction()` hook (replaces scattered setTimeout calls)

**Benefits:**
- Proper cleanup prevents memory leaks
- Timers pause/resume with game state
- Standardized timing patterns
- Mockable for testing

**Implementation:**
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
  
  return { timeLeft, isActive, pause: () => setIsActive(false), resume: () => setIsActive(true), reset: (s?: number) => { setTimeLeft(s ?? initialSeconds); setIsActive(true) } }
}

// hooks/useInterval.ts
export function useInterval(callback: () => void, delay: number | null, isActive = true) {
  const savedCallback = useRef<() => void>()
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (!isActive || delay === null) return
    const id = setInterval(() => savedCallback.current?.(), delay)
    return () => clearInterval(id)
  }, [delay, isActive])
}
```

---

## 4. Input Handling Abstraction

**Impact:** Medium-High — improves accessibility, standardizes controls

**What to create:**
- `useKeyboardControls()` hook (centralized key mapping)
- `useTouchGestures()` hook (standardized swipe detection)
- Default key bindings configuration

**Benefits:**
- Keyboard support for all games (currently only Tetris)
- Consistent control schemes
- Centralized accessibility improvements
- Easy to add new input methods

**Implementation:**
```typescript
// hooks/useKeyboardControls.ts
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
export function useTouchGestures(config: GestureConfig) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  // ... gesture detection logic
  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd }
}
```

---

## 5. Theme and Constants System

**Impact:** Medium — improves maintainability, enables theming

**What to create:**
- `game-constants.ts` (timing, dimensions, scoring values)
- `game-theme.ts` (colors, spacing, border radius)
- Theme utility functions

**Benefits:**
- Single source of truth for design tokens
- Easy to implement dark/light mode
- Centralized game balance tuning
- Type-safe constants

**Implementation:**
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
    emerald: { primary: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500' },
    purple: { primary: 'bg-purple-500', hover: 'hover:bg-purple-600', text: 'text-purple-400', border: 'border-purple-500' },
    orange: { primary: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-400', border: 'border-orange-500' },
  },
  spacing: { statsBar: 'px-6 py-3', statsBarCompact: 'px-4 py-2', modal: 'p-10', button: 'py-4 px-8' },
  borderRadius: { card: 'rounded-2xl', modal: 'rounded-3xl', button: 'rounded-xl' },
  backdrop: { overlay: 'bg-black/80 backdrop-blur-md', stats: 'bg-zinc-900/90 backdrop-blur-sm' },
} as const
```

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
