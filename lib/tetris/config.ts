import type { GameConfig } from "./types"

export const DEFAULT_CONFIG: GameConfig = {
  boardWidth: 10,
  boardHeight: 20,
  initialFallSpeed: 1000,
  minFallSpeed: 100,
  levelUpLines: 10,
  lockDelayMs: 500, // 500ms lock delay (Infinity mechanic)
  lockDelayResets: 15, // Max resets before forced lock
  scoring: {
    single: 100,
    double: 300,
    triple: 500,
    tetris: 800,
    softDrop: 1,
    hardDrop: 2,
  },
}
