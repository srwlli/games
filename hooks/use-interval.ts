"use client"

import { useEffect, useRef } from "react"

/**
 * Reusable interval hook that handles setInterval with proper cleanup.
 * Automatically pauses/resumes based on isActive flag.
 * Uses useRef to store callback to prevent stale closures.
 *
 * @param callback - Function to call on each interval
 * @param delay - Interval delay in milliseconds (null to pause)
 * @param isActive - Whether the interval should be active (default: true)
 *
 * @example
 * ```tsx
 * useInterval(() => {
 *   spawnTarget() // Game logic stays in component
 * }, 800, isPlaying) // Automatically pauses when game pauses
 * ```
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  isActive: boolean = true,
) {
  const savedCallback = useRef<() => void>()

  // Store the latest callback in ref to prevent stale closures
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    // Don't run if inactive or delay is null
    if (!isActive || delay === null) {
      return
    }

    const id = setInterval(() => {
      savedCallback.current?.()
    }, delay)

    return () => clearInterval(id)
  }, [delay, isActive])
}
