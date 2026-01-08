"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
      <div className="absolute top-6 left-0 right-0 flex justify-around px-8 z-10">
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-2xl px-6 py-3">
          <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Score</div>
          <div className="text-3xl font-black text-orange-400">{score}</div>
        </div>
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-2xl px-6 py-3">
          <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Time</div>
          <div className={`text-3xl font-black ${timeLeft < 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</div>
        </div>
      </div>

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
      <AnimatePresence>
        {!gameActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-zinc-900 border-2 border-orange-500 rounded-3xl p-10 text-center"
            >
              <h2 className="text-5xl font-black text-orange-400 mb-4">Time Up!</h2>
              <div className="text-6xl font-black text-white mb-6">{score}</div>
              <p className="text-zinc-400 mb-8">Final Score</p>
              <button
                onClick={resetGame}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
