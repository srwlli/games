"use client"

import { useState, useCallback, useMemo } from "react"

export type GameState = "idle" | "playing" | "paused" | "gameOver"

export interface UseGameStateOptions {
  initialState?: GameState
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onGameOver?: () => void
  onReset?: () => void
}

export function useGameState(options?: UseGameStateOptions) {
  const [state, setState] = useState<GameState>(options?.initialState ?? "idle")

  // Memoized callbacks - CRITICAL for useEffect dependencies
  const start = useCallback(() => {
    setState("playing")
    options?.onStart?.()
  }, [options?.onStart])

  const pause = useCallback(() => {
    setState("paused")
    options?.onPause?.()
  }, [options?.onPause])

  const resume = useCallback(() => {
    setState("playing")
    options?.onResume?.()
  }, [options?.onResume])

  const gameOver = useCallback(() => {
    setState("gameOver")
    options?.onGameOver?.()
  }, [options?.onGameOver])

  const reset = useCallback(() => {
    setState("idle")
    options?.onReset?.()
  }, [options?.onReset])

  // Memoized boolean flags for cleaner component code
  const isPlaying = useMemo(() => state === "playing", [state])
  const isPaused = useMemo(() => state === "paused", [state])
  const isGameOver = useMemo(() => state === "gameOver", [state])

  return {
    state,
    isPlaying,
    isPaused,
    isGameOver,
    start,
    pause,
    resume,
    gameOver,
    reset,
  }
}
