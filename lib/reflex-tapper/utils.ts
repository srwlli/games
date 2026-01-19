/**
 * Utility functions for Reflex Tapper game logic
 */

import type {
  Target,
  TargetColor,
  TargetType,
  PowerUpType,
  RulePhase,
  RulePhaseType,
  AdaptiveDifficulty,
  GameConfig,
  StreakState,
} from "./types"
import {
  GAME_MODES,
  TARGET_COLORS,
  SCORING,
  DIFFICULTY_RAMP,
  RULE_PHASES,
  ADAPTIVE_DIFFICULTY,
  POWER_UPS,
  SPAWN_PATTERNS,
} from "./config"

/**
 * Calculate current spawn interval based on elapsed time and difficulty ramp
 */
export function calculateSpawnInterval(elapsedSeconds: number, config: GameConfig): number {
  if (!config.adaptiveDifficulty) {
    return config.initialSpawnInterval
  }

  const progress = Math.min(elapsedSeconds / DIFFICULTY_RAMP.rampDuration, 1)
  const interval =
    config.initialSpawnInterval -
    (config.initialSpawnInterval - DIFFICULTY_RAMP.spawnIntervalMin) * progress

  return Math.max(interval, DIFFICULTY_RAMP.spawnIntervalMin)
}

/**
 * Calculate current target lifetime based on elapsed time and difficulty ramp
 */
export function calculateTargetLifetime(elapsedSeconds: number, config: GameConfig): number {
  if (!config.adaptiveDifficulty) {
    return config.initialTargetLifetime
  }

  const progress = Math.min(elapsedSeconds / DIFFICULTY_RAMP.rampDuration, 1)
  const lifetime =
    config.initialTargetLifetime -
    (config.initialTargetLifetime - DIFFICULTY_RAMP.targetLifetimeMin) * progress

  return Math.max(lifetime, DIFFICULTY_RAMP.targetLifetimeMin)
}

/**
 * Get current rule phase based on elapsed time
 */
export function getCurrentRulePhase(elapsedSeconds: number): RulePhase | null {
  let timeAccumulator = 0

  for (const phaseConfig of RULE_PHASES) {
    if (elapsedSeconds >= timeAccumulator && elapsedSeconds < timeAccumulator + phaseConfig.duration) {
      return {
        id: RULE_PHASES.indexOf(phaseConfig),
        type: phaseConfig.type as RulePhaseType,
        instruction: phaseConfig.instruction,
        targetColor: phaseConfig.targetColor,
        duration: phaseConfig.duration,
        startTime: timeAccumulator,
      }
    }
    timeAccumulator += phaseConfig.duration
  }

  // If beyond all phases, return last phase
  const lastPhase = RULE_PHASES[RULE_PHASES.length - 1]
  return {
    id: RULE_PHASES.length - 1,
    type: lastPhase.type as RulePhaseType,
    instruction: lastPhase.instruction,
    targetColor: lastPhase.targetColor,
    duration: lastPhase.duration,
    startTime: timeAccumulator - lastPhase.duration,
  }
}

/**
 * Check if a target should be tapped based on current rule phase
 */
export function shouldTapTarget(target: Target, currentPhase: RulePhase | null): boolean {
  if (!currentPhase) return true

  switch (currentPhase.type) {
    case "tap-any":
      return target.type !== "decoy"
    case "tap-color":
      return target.type !== "decoy" && target.color === currentPhase.targetColor
    case "avoid-color":
      return target.type !== "decoy" && target.color !== currentPhase.targetColor
    case "tap-only-left":
      return target.type !== "decoy" && target.x < 50
    case "tap-only-right":
      return target.type !== "decoy" && target.x >= 50
    default:
      return target.type !== "decoy"
  }
}

/**
 * Generate a random target
 */
export function generateTarget(
  config: GameConfig,
  currentPhase: RulePhase | null,
  existingTargets: Target[],
  elapsedSeconds: number,
): Target {
  const isPowerUp = Math.random() < config.powerUpSpawnChance
  const isDecoy = !isPowerUp && Math.random() < 0.15 // 15% chance of decoy

  let targetType: TargetType = "normal"
  let color: TargetColor | undefined
  let powerUpType: PowerUpType | undefined

  if (isPowerUp) {
    targetType = "powerup"
    const powerUpTypes: PowerUpType[] = ["extra-time", "slow-motion", "double-score"]
    powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
    color = "purple" // Power-ups are purple
  } else if (isDecoy) {
    targetType = "decoy"
    color = "red" // Decoys are red
  } else {
    // Normal target - assign color based on phase or random
    const colors: TargetColor[] = ["orange", "red", "blue", "green", "yellow", "purple"]
    if (currentPhase?.type === "tap-color" && currentPhase.targetColor) {
      // Higher chance of correct color during tap-color phase
      color = Math.random() < 0.7 ? currentPhase.targetColor : colors[Math.floor(Math.random() * colors.length)]
    } else {
      color = colors[Math.floor(Math.random() * colors.length)]
    }
  }

  const lifetime = calculateTargetLifetime(elapsedSeconds, config)

  // Check for overlap with existing targets
  // Targets are 64px (w-16 h-16), which is ~4% of screen width at 1600px
  // We need at least 12% distance to prevent visual overlap
  let x = Math.random() * 80 + 10
  let y = Math.random() * 70 + 15
  let attempts = 0
  const maxAttempts = 20 // Increased attempts for better placement
  const minDistance = 12 // Increased minimum distance to 12%

  while (attempts < maxAttempts) {
    const overlaps = existingTargets.some((t) => {
      const distance = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2))
      return distance < minDistance
    })

    if (!overlaps) break

    x = Math.random() * 80 + 10
    y = Math.random() * 70 + 15
    attempts++
  }

  // If still overlapping after max attempts, try to find a better position
  // by checking less crowded areas
  if (attempts >= maxAttempts && existingTargets.length > 0) {
    // Try positions away from existing targets
    const avgX = existingTargets.reduce((sum, t) => sum + t.x, 0) / existingTargets.length
    const avgY = existingTargets.reduce((sum, t) => sum + t.y, 0) / existingTargets.length
    
    // Try opposite side of average position
    x = avgX > 50 ? Math.random() * 30 + 10 : Math.random() * 30 + 60
    y = avgY > 50 ? Math.random() * 30 + 15 : Math.random() * 30 + 55
    
    // Final overlap check
    const stillOverlaps = existingTargets.some((t) => {
      const distance = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2))
      return distance < minDistance
    })
    
    // If still overlapping, use original position (better than not spawning)
    if (stillOverlaps) {
      x = Math.random() * 80 + 10
      y = Math.random() * 70 + 15
    }
  }

  return {
    id: Date.now() + Math.random(), // Ensure unique ID
    x,
    y,
    type: targetType,
    color,
    powerUpType,
    spawnTime: Date.now(),
    lifetime,
    pattern: color ? TARGET_COLORS[color]?.pattern : undefined,
  }
}

/**
 * Calculate score for hitting a target
 */
export function calculateScore(
  target: Target,
  streakState: StreakState,
  powerUpActive: { type: PowerUpType; multiplier: number } | null,
): number {
  if (target.type === "decoy") {
    return SCORING.decoyPenalty
  }

  if (target.type === "powerup") {
    return SCORING.powerUpBonus
  }

  let baseScore = SCORING.normalHit
  let multiplier = streakState.multiplier

  // Apply power-up multiplier
  if (powerUpActive?.type === "double-score") {
    multiplier *= powerUpActive.multiplier
  }

  return Math.floor(baseScore * multiplier)
}

/**
 * Update streak state after a hit or miss
 */
export function updateStreak(isHit: boolean, currentStreak: StreakState): StreakState {
  if (isHit) {
    const newStreak = currentStreak.current + 1
    const newMultiplier = Math.min(
      SCORING.streakMultiplierBase + newStreak * SCORING.streakMultiplierIncrement,
      SCORING.maxMultiplier,
    )
    return {
      current: newStreak,
      multiplier: newMultiplier,
      maxStreak: Math.max(currentStreak.maxStreak, newStreak),
    }
  } else {
    return {
      current: 0,
      multiplier: SCORING.streakMultiplierBase,
      maxStreak: currentStreak.maxStreak,
    }
  }
}

/**
 * Calculate adaptive difficulty adjustments
 */
export function calculateAdaptiveDifficulty(
  recentAccuracy: number,
  currentSpawnInterval: number,
  currentLifetime: number,
): AdaptiveDifficulty {
  const targetAccuracy = ADAPTIVE_DIFFICULTY.targetAccuracy
  const accuracyDiff = recentAccuracy - targetAccuracy

  // Adjust spawn interval: if too accurate, spawn faster; if too inaccurate, spawn slower
  let spawnMultiplier = 1.0
  if (accuracyDiff > 0.1) {
    // Too accurate - increase difficulty
    spawnMultiplier = 1.0 - ADAPTIVE_DIFFICULTY.spawnAdjustmentRate
  } else if (accuracyDiff < -0.1) {
    // Too inaccurate - decrease difficulty
    spawnMultiplier = 1.0 + ADAPTIVE_DIFFICULTY.spawnAdjustmentRate
  }

  // Adjust lifetime: if too accurate, shorter visibility; if too inaccurate, longer visibility
  let lifetimeMultiplier = 1.0
  if (accuracyDiff > 0.1) {
    lifetimeMultiplier = 1.0 - ADAPTIVE_DIFFICULTY.lifetimeAdjustmentRate
  } else if (accuracyDiff < -0.1) {
    lifetimeMultiplier = 1.0 + ADAPTIVE_DIFFICULTY.lifetimeAdjustmentRate
  }

  const newSpawnInterval = Math.max(
    ADAPTIVE_DIFFICULTY.minSpawnInterval,
    Math.min(ADAPTIVE_DIFFICULTY.maxSpawnInterval, currentSpawnInterval * spawnMultiplier),
  )

  const newLifetime = Math.max(
    ADAPTIVE_DIFFICULTY.minLifetime,
    Math.min(ADAPTIVE_DIFFICULTY.maxLifetime, currentLifetime * lifetimeMultiplier),
  )

  return {
    recentAccuracy,
    spawnIntervalMultiplier: newSpawnInterval / currentSpawnInterval,
    targetLifetimeMultiplier: newLifetime / currentLifetime,
    penaltyMultiplier: 1.0, // Can be adjusted based on difficulty
  }
}

/**
 * Check if spawn pattern should create a burst or gap
 */
export function shouldSpawnBurst(): boolean {
  return Math.random() < SPAWN_PATTERNS.burstChance
}

export function shouldSpawnGap(): boolean {
  return Math.random() < SPAWN_PATTERNS.gapChance
}

/**
 * Get color-blind friendly pattern class
 */
export function getPatternClass(pattern: string): string {
  const patternClasses: Record<string, string> = {
    circle: "rounded-full",
    square: "rounded-lg",
    triangle: "[clip-path:polygon(50%_0%,0%_100%,100%_100%)]",
    diamond: "[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]",
    star: "[clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]",
    hexagon: "[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]",
  }
  return patternClasses[pattern] || "rounded-full"
}
