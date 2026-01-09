"use client"

import { useEffect } from "react"

/**
 * One-time delayed action hook that executes callback after delay.
 * Cancels if component unmounts or delay/condition changes.
 * Supports conditional execution.
 *
 * @param callback - Function to call after delay
 * @param delay - Delay in milliseconds
 * @param condition - Optional condition to check before executing (default: true)
 *
 * @example
 * ```tsx
 * useDelayedAction(() => {
 *   setShowLevelUp(false) // Game logic
 * }, 2000, showLevelUp)
 * ```
 */
export function useDelayedAction(
  callback: () => void,
  delay: number,
  condition: boolean = true,
) {
  useEffect(() => {
    // Don't execute if condition is false
    if (!condition) {
      return
    }

    const timer = setTimeout(() => {
      callback()
    }, delay)

    return () => clearTimeout(timer)
  }, [callback, delay, condition])
}
