"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar } from "@/components/games/shared"

interface Stick {
  id: number
  color: string
}

export default function PickUpSticks() {
  const [sticks, setSticks] = useState<Stick[]>([])
  const [targetCount, setTargetCount] = useState(5)
  const [picked, setPicked] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState("")

  const initializeSticks = (count: number) => {
    const colors = [
      "from-red-500 to-red-700",
      "from-blue-500 to-blue-700",
      "from-green-500 to-green-700",
      "from-yellow-500 to-yellow-700",
      "from-purple-500 to-purple-700",
      "from-pink-500 to-pink-700",
    ]
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
    }))
  }

  useEffect(() => {
    setSticks(initializeSticks(12))
  }, [])

  const handleStickClick = (id: number) => {
    if (gameOver) return

    const newPicked = picked + 1
    setPicked(newPicked)
    setSticks(sticks.filter((s) => s.id !== id))

    if (newPicked === targetCount) {
      const pointsEarned = level * 50
      setScore(score + pointsEarned)
      setMessage(`+${pointsEarned} points!`)

      setTimeout(() => {
        const nextLevel = level + 1
        setLevel(nextLevel)
        const nextStickCount = 12 + nextLevel * 2
        const nextTarget = Math.min(5 + nextLevel, nextStickCount - 2)
        setSticks(initializeSticks(nextStickCount))
        setTargetCount(nextTarget)
        setPicked(0)
        setMessage("")
      }, 1500)
    } else if (newPicked < targetCount) {
      setMessage(`${targetCount - newPicked} more to go!`)
    }
  }

  const resetGame = () => {
    setSticks(initializeSticks(12))
    setTargetCount(5)
    setPicked(0)
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setMessage("")
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-zinc-950 flex flex-col items-center justify-between p-6 relative overflow-hidden">
      <StatsBar
        stats={[
          { label: "Level", value: level, color: "emerald", size: "compact" },
          { label: "Score", value: score, color: "white", size: "compact" },
          { label: "Target", value: `${picked}/${targetCount}`, color: "amber", size: "compact" },
        ]}
        layout="flex"
        className="w-full flex justify-between items-start z-10 gap-4"
      />

      <div className="absolute top-32 left-0 right-0 flex justify-center z-20">
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              key={message}
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 20 }}
              className="bg-emerald-500 text-zinc-950 font-black px-6 py-3 rounded-xl text-xl shadow-lg"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        <div className="grid grid-cols-3 gap-4 max-w-md w-full p-4">
          <AnimatePresence>
            {sticks.map((stick) => (
              <motion.button
                key={stick.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleStickClick(stick.id)}
                className={`aspect-[3/1] bg-gradient-to-br ${stick.color} rounded-2xl shadow-xl cursor-pointer touch-manipulation active:shadow-sm transition-shadow relative overflow-hidden`}
                style={{
                  touchAction: "manipulation",
                }}
              >
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-1 bg-white/30 absolute top-1/4" />
                  <div className="w-full h-1 bg-white/20 absolute top-1/2" />
                  <div className="w-full h-1 bg-white/30 absolute top-3/4" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full text-center pb-4">
        <p className="text-zinc-400 text-sm">
          Tap <span className="text-emerald-400 font-bold">{targetCount}</span> sticks to complete the level
        </p>
      </div>
    </div>
  )
}
