# Game Session Context

## Overview

The `GameSessionProvider` provides global game session tracking across the entire platform. It automatically tracks when games are started and ended, and provides analytics capabilities.

## Features

- ✅ Automatic session tracking (starts when game mounts, ends when user exits)
- ✅ Score tracking per session
- ✅ Custom metadata per session
- ✅ Session history (last 100 sessions)
- ✅ Analytics helpers (total games, best scores, play time)
- ✅ localStorage persistence

## Usage

### Basic Usage (Automatic)

Sessions are automatically tracked when games are mounted via `app/games/[slug]/game-client.tsx`. No action required!

### Advanced Usage (Score Tracking)

For games that want to track scores and metadata:

```typescript
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"

export default function MyGame() {
  const [score, setScore] = useState(0)
  const { updateScore, endGameSession } = useGameSessionIntegration('my-game')

  // Update score during gameplay
  useEffect(() => {
    updateScore(score)
  }, [score])

  // End session with final score
  const handleGameOver = () => {
    endGameSession(score, { level: currentLevel })
  }
}
```

### Direct API Usage

```typescript
import { useGameSession } from "@/hooks/use-game-session"

const {
  currentGame,
  isInGame,
  startSession,
  endSession,
  updateSession,
  getBestScoreFor,
  getTotalGamesPlayed,
} = useGameSession()
```

## API Reference

See `GAME-STATE-REVIEW.md` for full API documentation and examples.
