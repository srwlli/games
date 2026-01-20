"use client"

import { useState, useEffect, useCallback } from "react"
import { useInterval } from "./use-interval"

export interface UseCountdownReturn {
  timeLeft: number
  reset: (newInitialSeconds?: number) => void
  setTimeLeft: (time: number | ((prev: number) => number)) => void
}

/**
 * Countdown timer hook that counts down from initial seconds.
 * Calls onComplete when reaching 0.
 * Pauses/resumes with game state via isActive flag.
 * Supports reset with optional new initial value.
 */
export function useCountdown(
  initialSeconds: number,
  onComplete?: () => void,
  isActive: boolean = true,
): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)

  // Reset function - memoized for stable reference
  const reset = useCallback(
    (newInitialSeconds?: number) => {
      setTimeLeft(newInitialSeconds ?? initialSeconds)
    },
    [initialSeconds],
  )

  // Use the standardized useInterval for the ticking logic
  useInterval(
    () => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    },
    timeLeft > 0 ? 1000 : null,
    isActive,
  )

  // Handle completion separately from state update to avoid render-time updates
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      onComplete?.()
    }
  }, [timeLeft, onComplete, isActive])

  // Sync timeLeft if initialSeconds changes externally (preserved behavior)
  useEffect(() => {
    setTimeLeft(initialSeconds)
  }, [initialSeconds])

  return { timeLeft, reset, setTimeLeft }
}
