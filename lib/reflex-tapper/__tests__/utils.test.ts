/**
 * Unit tests for Reflex Tapper utility functions
 * 
 * Note: Requires test framework setup (Jest/Vitest)
 * Run: npm test lib/reflex-tapper
 */

import { describe, it, expect } from "@jest/globals"
import {
  calculateSpawnInterval,
  calculateTargetLifetime,
  getCurrentRulePhase,
  shouldTapTarget,
  calculateScore,
  updateStreak,
  calculateAdaptiveDifficulty,
} from "../utils"
import type { Target, RulePhase, GameConfig, StreakState } from "../types"
import { GAME_MODES } from "../config"

describe("Reflex Tapper Utils", () => {
  describe("calculateSpawnInterval", () => {
    it("should return initial interval when adaptive difficulty is disabled", () => {
      const config: GameConfig = { ...GAME_MODES["sudden-death"], adaptiveDifficulty: false }
      expect(calculateSpawnInterval(0, config)).toBe(1000)
      expect(calculateSpawnInterval(10, config)).toBe(1000)
    })

    it("should decrease interval over time when adaptive difficulty is enabled", () => {
      const config: GameConfig = { ...GAME_MODES.classic, adaptiveDifficulty: true }
      const initial = calculateSpawnInterval(0, config)
      const later = calculateSpawnInterval(10, config)
      expect(later).toBeLessThan(initial)
    })

    it("should not go below minimum interval", () => {
      const config: GameConfig = { ...GAME_MODES.classic, adaptiveDifficulty: true }
      const result = calculateSpawnInterval(100, config) // Very long time
      expect(result).toBeGreaterThanOrEqual(300) // Minimum
    })
  })

  describe("calculateTargetLifetime", () => {
    it("should return initial lifetime when adaptive difficulty is disabled", () => {
      const config: GameConfig = { ...GAME_MODES["sudden-death"], adaptiveDifficulty: false }
      expect(calculateTargetLifetime(0, config)).toBe(2000)
    })

    it("should decrease lifetime over time when adaptive difficulty is enabled", () => {
      const config: GameConfig = { ...GAME_MODES.classic, adaptiveDifficulty: true }
      const initial = calculateTargetLifetime(0, config)
      const later = calculateTargetLifetime(10, config)
      expect(later).toBeLessThan(initial)
    })
  })

  describe("getCurrentRulePhase", () => {
    it("should return first phase at start", () => {
      const phase = getCurrentRulePhase(0)
      expect(phase).toBeTruthy()
      expect(phase?.type).toBe("tap-any")
    })

    it("should return correct phase based on elapsed time", () => {
      const phase1 = getCurrentRulePhase(2) // Within first phase (0-5s)
      expect(phase1?.type).toBe("tap-any")

      const phase2 = getCurrentRulePhase(7) // Second phase (5-10s)
      expect(phase2?.type).toBe("tap-color")
    })
  })

  describe("shouldTapTarget", () => {
    it("should allow tapping normal targets in tap-any phase", () => {
      const phase: RulePhase = {
        id: 0,
        type: "tap-any",
        instruction: "Tap any target",
        duration: 5,
        startTime: 0,
      }
      const target: Target = {
        id: 1,
        x: 50,
        y: 50,
        type: "normal",
        color: "orange",
        spawnTime: Date.now(),
        lifetime: 1500,
      }
      expect(shouldTapTarget(target, phase)).toBe(true)
    })

    it("should reject decoy targets", () => {
      const phase: RulePhase = {
        id: 0,
        type: "tap-any",
        instruction: "Tap any target",
        duration: 5,
        startTime: 0,
      }
      const target: Target = {
        id: 1,
        x: 50,
        y: 50,
        type: "decoy",
        color: "red",
        spawnTime: Date.now(),
        lifetime: 1500,
      }
      expect(shouldTapTarget(target, phase)).toBe(false)
    })

    it("should only allow correct color in tap-color phase", () => {
      const phase: RulePhase = {
        id: 1,
        type: "tap-color",
        instruction: "Tap only orange targets",
        targetColor: "orange",
        duration: 5,
        startTime: 5,
      }
      const orangeTarget: Target = {
        id: 1,
        x: 50,
        y: 50,
        type: "normal",
        color: "orange",
        spawnTime: Date.now(),
        lifetime: 1500,
      }
      const blueTarget: Target = {
        id: 2,
        x: 50,
        y: 50,
        type: "normal",
        color: "blue",
        spawnTime: Date.now(),
        lifetime: 1500,
      }
      expect(shouldTapTarget(orangeTarget, phase)).toBe(true)
      expect(shouldTapTarget(blueTarget, phase)).toBe(false)
    })
  })

  describe("calculateScore", () => {
    it("should return penalty for decoy", () => {
      const target: Target = {
        id: 1,
        x: 50,
        y: 50,
        type: "decoy",
        color: "red",
        spawnTime: Date.now(),
        lifetime: 1500,
      }
      const streak: StreakState = { current: 0, multiplier: 1.0, maxStreak: 0 }
      expect(calculateScore(target, streak, null)).toBe(-20)
    })

    it("should return base score for normal target", () => {
      const target: Target = {
        id: 1,
        x: 50,
        y: 50,
        type: "normal",
        color: "orange",
        spawnTime: Date.now(),
        lifetime: 1500,
      }
      const streak: StreakState = { current: 0, multiplier: 1.0, maxStreak: 0 }
      expect(calculateScore(target, streak, null)).toBe(10)
    })

    it("should apply streak multiplier", () => {
      const target: Target = {
        id: 1,
        x: 50,
        y: 50,
        type: "normal",
        color: "orange",
        spawnTime: Date.now(),
        lifetime: 1500,
      }
      const streak: StreakState = { current: 5, multiplier: 1.5, maxStreak: 5 }
      expect(calculateScore(target, streak, null)).toBe(15) // 10 * 1.5
    })
  })

  describe("updateStreak", () => {
    it("should increment streak on hit", () => {
      const current: StreakState = { current: 0, multiplier: 1.0, maxStreak: 0 }
      const updated = updateStreak(true, current)
      expect(updated.current).toBe(1)
      expect(updated.multiplier).toBeGreaterThan(1.0)
    })

    it("should reset streak on miss", () => {
      const current: StreakState = { current: 5, multiplier: 1.5, maxStreak: 5 }
      const updated = updateStreak(false, current)
      expect(updated.current).toBe(0)
      expect(updated.multiplier).toBe(1.0)
    })

    it("should track max streak", () => {
      const current: StreakState = { current: 3, multiplier: 1.3, maxStreak: 3 }
      const updated = updateStreak(true, current)
      expect(updated.maxStreak).toBe(4)
    })
  })

  describe("calculateAdaptiveDifficulty", () => {
    it("should increase difficulty when accuracy is too high", () => {
      const result = calculateAdaptiveDifficulty(0.9, 800, 1500) // 90% accuracy
      expect(result.spawnIntervalMultiplier).toBeLessThan(1.0) // Faster spawns
      expect(result.targetLifetimeMultiplier).toBeLessThan(1.0) // Shorter visibility
    })

    it("should decrease difficulty when accuracy is too low", () => {
      const result = calculateAdaptiveDifficulty(0.5, 800, 1500) // 50% accuracy
      expect(result.spawnIntervalMultiplier).toBeGreaterThan(1.0) // Slower spawns
      expect(result.targetLifetimeMultiplier).toBeGreaterThan(1.0) // Longer visibility
    })
  })
})
