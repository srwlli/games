"use client"

import { useState, useEffect, useCallback } from "react"

export interface UseStartCountdownReturn {
    /** Current value to display (3, 2, 1, 'GO!' or null) */
    countdown: number | "GO!" | null
    /** Start the countdown sequence */
    startCountdown: () => void
    /** Reset the countdown to null */
    resetCountdown: () => void
    /** True if the countdown is currently running */
    isActive: boolean
}

interface UseStartCountdownOptions {
    /** Seconds to count down from (default: 3) */
    duration?: number
    /** Callback when countdown finishes */
    onComplete?: () => void
    /** Whether the countdown should pause (e.g. if game is paused) */
    isPaused?: boolean
}

/**
 * Standardized "3, 2, 1, GO!" countdown hook for game starts.
 */
export function useStartCountdown({
    duration = 3,
    onComplete,
    isPaused = false,
}: UseStartCountdownOptions = {}): UseStartCountdownReturn {
    const [countdown, setCountdown] = useState<number | "GO!" | null>(null)
    const [phase, setPhase] = useState<number>(0) // internal seconds counter

    const resetCountdown = useCallback(() => {
        setCountdown(null)
        setPhase(0)
    }, [])

    const startCountdown = useCallback(() => {
        setPhase(duration + 1) // +1 for the "GO!" phase if we want it, or just duration
        setCountdown(duration)
    }, [duration])

    useEffect(() => {
        if (countdown === null || isPaused) return

        const timer = setTimeout(() => {
            if (typeof countdown === "number") {
                if (countdown > 1) {
                    setCountdown(countdown - 1)
                } else {
                    setCountdown("GO!")
                }
            } else if (countdown === "GO!") {
                setCountdown(null)
                onComplete?.()
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [countdown, isPaused, onComplete])

    return {
        countdown,
        startCountdown,
        resetCountdown,
        isActive: countdown !== null,
    }
}
