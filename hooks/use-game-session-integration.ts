/**
 * Helper hook for easy game integration with session manager
 * 
 * This hook provides a simple way for games to:
 * - Update their score in the session
 * - End the session with final score when game over
 * - Track additional metadata (level, difficulty, etc.)
 * 
 * @example
 * ```tsx
 * const { updateScore, endGameSession } = useGameSessionIntegration('tetris')
 * 
 * // Update score during gameplay
 * useEffect(() => {
 *   updateScore(score)
 * }, [score])
 * 
 * // End session when game over
 * const handleGameOver = () => {
 *   endGameSession(score, { level: currentLevel, lines: clearedLines })
 * }
 * ```
 */

import { useGameSession } from "@/hooks/use-game-session"
import { useEffect, useRef, useCallback, startTransition } from "react"
import type { GAMES_REGISTRY } from "@/lib/games-registry"

type GameId = keyof typeof GAMES_REGISTRY

export function useGameSessionIntegration(gameId: GameId) {
  const { updateSession, endSession, currentSession } = useGameSession()
  const lastScoreRef = useRef<number | null>(null)

  // Update score in session (debounced to avoid too many updates)
  // Wrapped in useCallback to ensure stable reference and prevent render-time calls
  const updateScore = useCallback((score: number) => {
    // Only update if score actually changed
    if (score !== lastScoreRef.current) {
      lastScoreRef.current = score
      // Use startTransition to defer state update, avoiding render-time updates
      startTransition(() => {
        updateSession({ score })
      })
    }
  }, [updateSession])

  // End game session with final score and metadata
  const endGameSession = (finalScore?: number, metadata?: Record<string, unknown>) => {
    const scoreToSave = finalScore ?? lastScoreRef.current ?? currentSession?.score ?? null
    endSession(scoreToSave ?? undefined, metadata)
  }

  // Update metadata without ending session
  const updateMetadata = (metadata: Record<string, unknown>) => {
    updateSession({ metadata })
  }

  return {
    updateScore,
    endGameSession,
    updateMetadata,
    currentSession,
  }
}
