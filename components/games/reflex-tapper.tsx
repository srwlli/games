"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"

export default function ReflexTapper() {
  const [targets, setTargets] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [gameActive, setGameActive] = useState(true)

  useEffect(() => {
    if (!gameActive) return

    const spawnInterval = setInterval(() => {
      const newTarget = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15,
      }
      setTargets((prev) => [...prev, newTarget])

      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== newTarget.id))
      }, 1500)
    }, 800)

    return () => clearInterval(spawnInterval)
  }, [gameActive])

  useEffect(() => {
    if (timeLeft > 0 && gameActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameActive(false)
    }
  }, [timeLeft, gameActive])

  const handleTargetClick = (id: number) => {
    setTargets(targets.filter((t) => t.id !== id))
    setScore(score + 10)
  }

  const resetGame = () => {
    setTargets([])
    setScore(0)
    setTimeLeft(20)
    setGameActive(true)
  }

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
        isOpen={!gameActive}
        title="Time Up!"
        score={score}
        scoreLabel="Final Score"
        accentColor="orange"
        onPlayAgain={resetGame}
      />
    </div>
  )
}
