"use client"

import { useState, useEffect, useCallback } from "react"

export interface UseCountdownReturn {
  timeLeft: number
  reset: (newInitialSeconds?: number) => void
}

/**
 * Countdown timer hook that counts down from initial seconds.
 * Calls onComplete when reaching 0.
 * Pauses/resumes with game state via isActive flag.
 * Supports reset with optional new initial value.
 *
 * @param initialSeconds - Starting countdown value in seconds
 * @param onComplete - Callback to execute when countdown reaches 0
 * @param isActive - Whether the countdown should be active (default: true)
 *
 * @example
 * ```tsx
 * const { timeLeft, reset: resetTimer } = useCountdown(20, () => gameOver(), isPlaying)
 * ```
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

  // Countdown effect
  useEffect(() => {
    // Don't run if inactive or already at 0
    if (!isActive || timeLeft <= 0) {
      if (timeLeft === 0 && onComplete) {
        onComplete()
      }
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, isActive, onComplete])

  // Reset timeLeft when initialSeconds changes externally
  useEffect(() => {
    setTimeLeft(initialSeconds)
  }, [initialSeconds])

  return { timeLeft, reset }
}
