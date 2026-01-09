"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useInterval } from "@/hooks/use-interval"
import { useCountdown } from "@/hooks/use-countdown"

export default function ReflexTapper() {
  const [targets, setTargets] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [score, setScore] = useState(0)
  const { isPlaying, isGameOver, pause, resume, gameOver, reset, start } = useGameState({
    initialState: "playing",
  })

  // Countdown timer - automatically pauses/resumes with game state
  const { timeLeft, reset: resetTimer } = useCountdown(20, () => gameOver(), isPlaying)

  // Spawn targets at interval - automatically pauses/resumes with game state
  const spawnTarget = useCallback(() => {
    const newTarget = {
      id: Date.now(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
    }
    setTargets((prev) => [...prev, newTarget])

    // Target lifetime - remove after 1500ms (kept as setTimeout since it's per-target)
    setTimeout(() => {
      setTargets((prev) => prev.filter((t) => t.id !== newTarget.id))
    }, 1500)
  }, [])

  useInterval(spawnTarget, 800, isPlaying)

  const handleTargetClick = (id: number) => {
    setTargets(targets.filter((t) => t.id !== id))
    setScore(score + 10)
  }

  const resetGame = () => {
    setTargets([])
    setScore(0)
    resetTimer(20) // Reset countdown to 20 seconds
    reset()
    start()
  }

  // Add pause/resume keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (isPlaying) {
          pause()
        } else if (!isGameOver) {
          resume()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, isGameOver, pause, resume])

  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-950 to-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Stats */}
      <StatsBar
        stats={[
          { label: "Score", value: score, color: "orange" },
          {
            label: "Time",
            value: `${timeLeft}s`,
            color: timeLeft < 10 ? "red" : "white",
          },
        ]}
        layout="absolute"
        position="top"
      />

      {/* Target Area */}
      <div className="relative w-full h-full">
        <AnimatePresence>
          {targets.map((target) => (
            <motion.button
              key={target.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleTargetClick(target.id)}
              className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/50 flex items-center justify-center text-2xl cursor-pointer"
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
            >
              🎯
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Over */}
      <GameOverModal
        isOpen={isGameOver}
        title="Time Up!"
        score={score}
        scoreLabel="Final Score"
        accentColor="orange"
        onPlayAgain={resetGame}
      />
    </div>
  )
}
