"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { StatsBar, GameOverModal, StartScreen, CountdownOverlay } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useDelayedAction } from "@/hooks/use-delayed-action"

const EMOJIS = ["🎮", "🎯", "🎲", "🎪", "🎨", "🎭", "🎸", "🎺"]

export default function MemoryMatch() {
  const [cards, setCards] = useState<Array<{ id: number; emoji: string; flipped: boolean; matched: boolean }>>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [shouldCheckMatch, setShouldCheckMatch] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownStartedRef = useRef(false)
  const { isPlaying, isPaused, isGameOver, pause, resume, reset, start, gameOver } = useGameState({
    initialState: "idle",
  })

  const initializeGame = useCallback(() => {
    const doubled = [...EMOJIS, ...EMOJIS]
    const shuffled = doubled
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({
        id: idx,
        emoji,
        flipped: false,
        matched: false,
      }))
    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    start()
    // Start countdown
    countdownStartedRef.current = true
    setCountdown(3)
  }, [start])

  const handleStart = useCallback(() => {
    initializeGame()
  }, [initializeGame])

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null)
        // Game actually starts now (countdown finished)
      } else {
        setCountdown(countdown - 1)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  const handleReset = useCallback(() => {
    reset()
    setCountdown(null)
    countdownStartedRef.current = false
    // Do not auto-start - user must click "Start Game" again
  }, [reset])

  const handleCardClick = (id: number) => {
    if (!isPlaying || countdown !== null || flippedCards.length === 2 || cards[id].flipped || cards[id].matched) return

    const newCards = [...cards]
    newCards[id].flipped = true
    setCards(newCards)

    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(moves + 1)
      setShouldCheckMatch(true) // Trigger delayed match check
    }
  }

  // Delayed match check - automatically handles cleanup
  useDelayedAction(
    () => {
      const [first, second] = flippedCards
      const newCards = [...cards]
      
      if (cards[first]?.emoji === cards[second]?.emoji) {
        newCards[first].matched = true
        newCards[second].matched = true

        if (newCards.every((card) => card.matched)) {
          gameOver()
        }
      } else {
        newCards[first].flipped = false
        newCards[second].flipped = false
      }
      
      setCards(newCards)
      setFlippedCards([])
      setShouldCheckMatch(false)
    },
    800,
    shouldCheckMatch,
  )

  // Add pause/resume keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (isPlaying) {
          pause()
        } else if (isPaused) {
          resume()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, isPaused, pause, resume])

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-950 to-zinc-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Start Screen */}
      {!isPlaying && !isGameOver && (
        <StartScreen
          title="Memory Match"
          description="Flip cards and match pairs to win!"
          onStart={handleStart}
          accentColor="purple"
          controls={["Click cards to flip", "P or Escape to pause"]}
        />
      )}

      {/* Countdown Overlay */}
      <CountdownOverlay count={countdown} accentColor="purple" />

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-10">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-4">Paused</h2>
            <button
              onClick={resume}
              className="bg-purple-500 hover:bg-purple-600 text-white font-black py-3 px-6 rounded-xl transition-colors"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <StatsBar
        stats={[{ label: "Moves", value: moves, color: "purple" }]}
        layout="absolute"
        position="top"
      />

      {/* Card Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-lg">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-2xl flex items-center justify-center text-4xl font-bold transition-all ${
              card.flipped || card.matched
                ? "bg-purple-500 shadow-lg shadow-purple-500/50"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "?"}
          </motion.button>
        ))}
      </div>

      {/* Win Modal */}
      <GameOverModal
        isOpen={isGameOver}
        title="Victory!"
        score={moves}
        scoreLabel="Moves to complete"
        accentColor="purple"
        onPlayAgain={handleReset}
      />
    </div>
  )
}
