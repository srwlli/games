/**
 * Persistence utilities for Reflex Tapper game stats
 * Uses localStorage with error handling for quota exceeded
 */

import type { GameStats } from "./types"

const STORAGE_KEY = "reflex-tapper-stats"

/**
 * Load game stats from localStorage
 */
export function loadStats(): GameStats | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const stats = JSON.parse(stored) as GameStats
    return stats
  } catch (e) {
    console.warn("Failed to load stats from localStorage", e)
    return null
  }
}

/**
 * Save game stats to localStorage
 */
export function saveStats(stats: GameStats): boolean {
  if (typeof window === "undefined") return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, clearing old data")
      // Try to clear and retry once
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
        return true
      } catch (retryError) {
        console.error("Failed to save stats after clearing", retryError)
        return false
      }
    }
    console.warn("Failed to save stats to localStorage", e)
    return false
  }
}

/**
 * Update stats with a new game result
 */
export function updateStats(
  score: number,
  averageReactionTime: number,
  bestReactionTime: number,
  hitRate: number,
  totalHits: number,
  totalMisses: number,
): GameStats {
  const existing = loadStats()

  if (!existing) {
    // First game
    return {
      totalGames: 1,
      averageScore: score,
      averageReactionTime,
      bestScore: score,
      bestReactionTime,
      hitRate,
      totalHits,
      totalMisses,
    }
  }

  // Update existing stats
  const newTotalGames = existing.totalGames + 1
  const newAverageScore = (existing.averageScore * existing.totalGames + score) / newTotalGames
  const newAverageReactionTime =
    (existing.averageReactionTime * existing.totalGames + averageReactionTime) / newTotalGames
  const newTotalHits = existing.totalHits + totalHits
  const newTotalMisses = existing.totalMisses + totalMisses
  const newHitRate = newTotalHits / (newTotalHits + newTotalMisses)

  return {
    totalGames: newTotalGames,
    averageScore: newAverageScore,
    averageReactionTime: newAverageReactionTime,
    bestScore: Math.max(existing.bestScore, score),
    bestReactionTime: Math.min(existing.bestReactionTime, bestReactionTime),
    hitRate: newHitRate,
    totalHits: newTotalHits,
    totalMisses: newTotalMisses,
  }
}

/**
 * Clear all saved stats
 */
export function clearStats(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn("Failed to clear stats from localStorage", e)
  }
}
