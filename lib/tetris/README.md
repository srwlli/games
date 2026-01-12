# Tetris Engine

A modular, performant Tetris game engine with modern mechanics.

## Architecture

The engine is split into several modules:

- **types.ts**: TypeScript type definitions and enums
- **config.ts**: Centralized game configuration
- **shapes.ts**: Tetromino shape definitions
- **engine.ts**: Core game logic (collision, rotation, line clearing)
- **cell-styles.ts**: Style mapping (semantic types → CSS classes)
- **sounds.ts**: Sound effect system

## Key Features

### Modern Tetris Mechanics

- **Lock Delay (Infinity)**: 500ms grace period before locking, resettable by movement
- **Wall Kicks (SRS-Lite)**: Rotation attempts small offsets when colliding
- **Hold Piece**: Store current piece for later use (once per piece)

### Performance Optimizations

- **Memoized Rendering**: React.memo for board cells/rows
- **Precomputed Bounds**: Collision detection uses precomputed piece bounds
- **Ref-based State**: Avoids stale closures in intervals

### Accessibility

- **ARIA Labels**: Full screen reader support
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Keyboard Navigation**: Full keyboard support

## Usage

```typescript
import { useTetrisEngine } from "@/hooks/use-tetris-engine"

const engine = useTetrisEngine({
  isPlaying: true,
  onGameOver: () => console.log("Game over!"),
  onLevelUp: (level) => console.log(`Level ${level}!`),
})

// Use engine methods
engine.moveLeft()
engine.rotate()
engine.hardDrop()
engine.holdPiece()
```

## Configuration

All game parameters are centralized in `config.ts`:

```typescript
export const DEFAULT_CONFIG: GameConfig = {
  boardWidth: 10,
  boardHeight: 20,
  initialFallSpeed: 1000,
  minFallSpeed: 100,
  levelUpLines: 10,
  lockDelayMs: 500,
  lockDelayResets: 15,
  scoring: {
    single: 100,
    double: 300,
    triple: 500,
    tetris: 800,
    softDrop: 1,
    hardDrop: 2,
  },
}
```

## Testing

Run tests with:

```bash
npm test lib/tetris
```

Tests cover:
- Collision detection
- Piece rotation
- Line clearing
- Score calculation
- Speed calculation
