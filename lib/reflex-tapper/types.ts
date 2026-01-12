/**
 * Types and interfaces for Reflex Tapper enhanced game system
 */

export type GameMode = "classic" | "sudden-death" | "burst"

export type TargetType = "normal" | "decoy" | "powerup"

export type TargetColor = "orange" | "red" | "blue" | "green" | "yellow" | "purple"

export type PowerUpType = "extra-time" | "slow-motion" | "double-score"

export type RulePhaseType = "tap-any" | "tap-color" | "avoid-color" | "tap-only-left" | "tap-only-right"

export interface Target {
  id: number
  x: number // Percentage (10-90)
  y: number // Percentage (15-85)
  type: TargetType
  color?: TargetColor
  powerUpType?: PowerUpType
  spawnTime: number // Timestamp when target spawned
  lifetime: number // Milliseconds before auto-despawn
  pattern?: string // For color-blind support (e.g., "circle", "square", "triangle")
}

export interface RulePhase {
  id: number
  type: RulePhaseType
  instruction: string
  targetColor?: TargetColor // For tap-color or avoid-color phases
  duration: number // Seconds this phase lasts
  startTime: number // Timestamp when phase started
}

export interface ReactionTime {
  targetId: number
  reactionMs: number
  timestamp: number
}

export interface GameStats {
  totalGames: number
  averageScore: number
  averageReactionTime: number
  bestScore: number
  bestReactionTime: number
  hitRate: number // Percentage of successful hits
  totalHits: number
  totalMisses: number
}

export interface GameConfig {
  mode: GameMode
  initialTime: number // Seconds
  initialSpawnInterval: number // Milliseconds
  initialTargetLifetime: number // Milliseconds
  maxTargetsOnScreen: number
  adaptiveDifficulty: boolean
  powerUpSpawnChance: number // 0-1 probability
}

export interface StreakState {
  current: number
  multiplier: number
  maxStreak: number
}

export interface AdaptiveDifficulty {
  recentAccuracy: number // 0-1, average accuracy over last N targets
  spawnIntervalMultiplier: number // Adjusts spawn rate
  targetLifetimeMultiplier: number // Adjusts visibility time
  penaltyMultiplier: number // Adjusts penalty severity
}
