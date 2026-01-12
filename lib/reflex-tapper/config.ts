/**
 * Configuration constants for Reflex Tapper game
 */

import type { GameConfig, GameMode } from "./types"

export const GAME_MODES: Record<GameMode, GameConfig> = {
  classic: {
    mode: "classic",
    initialTime: 20,
    initialSpawnInterval: 800,
    initialTargetLifetime: 1500,
    maxTargetsOnScreen: 20,
    adaptiveDifficulty: true,
    powerUpSpawnChance: 0.05, // 5% chance
  },
  "sudden-death": {
    mode: "sudden-death",
    initialTime: 60, // Longer time limit
    initialSpawnInterval: 1000,
    initialTargetLifetime: 2000,
    maxTargetsOnScreen: 15,
    adaptiveDifficulty: false, // Fixed difficulty
    powerUpSpawnChance: 0.1, // Higher chance for power-ups
  },
  burst: {
    mode: "burst",
    initialTime: 5, // Very short
    initialSpawnInterval: 400, // Fast spawns
    initialTargetLifetime: 800, // Short visibility
    maxTargetsOnScreen: 25,
    adaptiveDifficulty: false,
    powerUpSpawnChance: 0.02, // Lower chance
  },
}

export const TARGET_COLORS: Record<string, { bg: string; text: string; pattern: string }> = {
  orange: {
    bg: "from-orange-400 to-red-500",
    text: "text-orange-400",
    pattern: "circle",
  },
  red: {
    bg: "from-red-500 to-rose-600",
    text: "text-red-400",
    pattern: "square",
  },
  blue: {
    bg: "from-blue-400 to-cyan-500",
    text: "text-blue-400",
    pattern: "triangle",
  },
  green: {
    bg: "from-green-400 to-emerald-500",
    text: "text-green-400",
    pattern: "diamond",
  },
  yellow: {
    bg: "from-yellow-400 to-amber-500",
    text: "text-yellow-400",
    pattern: "star",
  },
  purple: {
    bg: "from-purple-400 to-violet-500",
    text: "text-purple-400",
    pattern: "hexagon",
  },
}

export const SCORING = {
  normalHit: 10,
  decoyPenalty: -20,
  powerUpBonus: 50,
  streakMultiplierBase: 1.0,
  streakMultiplierIncrement: 0.1, // +0.1 per streak
  maxMultiplier: 3.0,
}

export const DIFFICULTY_RAMP = {
  spawnIntervalMin: 300, // Fastest spawn interval (ms)
  spawnIntervalMax: 1200, // Slowest spawn interval (ms)
  targetLifetimeMin: 500, // Shortest visibility (ms)
  targetLifetimeMax: 2500, // Longest visibility (ms)
  rampDuration: 20, // Seconds over which to ramp
}

export const RULE_PHASES: Array<{
  type: "tap-any" | "tap-color" | "avoid-color"
  instruction: string
  duration: number
  targetColor?: "orange" | "red" | "blue" | "green" | "yellow" | "purple"
}> = [
  { type: "tap-any", instruction: "Tap any target", duration: 5 },
  { type: "tap-color", instruction: "Tap only orange targets", targetColor: "orange", duration: 5 },
  { type: "avoid-color", instruction: "Avoid red targets", targetColor: "red", duration: 5 },
  { type: "tap-color", instruction: "Tap only blue targets", targetColor: "blue", duration: 5 },
  { type: "tap-any", instruction: "Tap any target", duration: 5 },
]

export const ADAPTIVE_DIFFICULTY = {
  accuracyWindow: 10, // Number of recent targets to consider
  targetAccuracy: 0.7, // Target 70% accuracy for "sweet spot"
  spawnAdjustmentRate: 0.1, // How quickly to adjust spawn rate
  lifetimeAdjustmentRate: 0.1, // How quickly to adjust lifetime
  minSpawnInterval: 300,
  maxSpawnInterval: 1200,
  minLifetime: 500,
  maxLifetime: 2500,
}

export const POWER_UPS = {
  extraTime: { duration: 5000, timeAdded: 5 }, // 5 seconds added
  slowMotion: { duration: 3000, speedMultiplier: 0.5 }, // 50% speed
  doubleScore: { duration: 10000, multiplier: 2.0 }, // 2x score
}

export const SPAWN_PATTERNS = {
  burstChance: 0.2, // 20% chance of burst spawn
  burstSize: 3, // Number of targets in burst
  gapChance: 0.15, // 15% chance of gap (no spawn)
  gapDuration: 2000, // Milliseconds of gap
}

export const ACCESSIBILITY = {
  ariaLiveDebounce: 100, // ms to debounce aria-live updates
  keyboardActivationKeys: ["Enter", " "], // Keys to activate targets
  reducedMotionDuration: 0, // Instant transitions for reduced motion
}
