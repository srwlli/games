"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"

const EMOJIS = ["🎮", "🎯", "🎲", "🎪", "🎨", "🎭", "🎸", "🎺"]

export default function MemoryMatch() {
  const [cards, setCards] = useState<Array<{ id: number; emoji: string; flipped: boolean; matched: boolean }>>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = () => {
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
    setGameWon(false)
  }

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].flipped || cards[id].matched) return

    const newCards = [...cards]
    newCards[id].flipped = true
    setCards(newCards)

    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(moves + 1)

      setTimeout(() => {
        const [first, second] = newFlipped
        if (cards[first].emoji === cards[second].emoji) {
          newCards[first].matched = true
          newCards[second].matched = true

          if (newCards.every((card) => card.matched)) {
            setGameWon(true)
          }
        } else {
          newCards[first].flipped = false
          newCards[second].flipped = false
        }
        setCards([...newCards])
        setFlippedCards([])
      }, 800)
    }
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-950 to-zinc-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
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
        isOpen={gameWon}
        title="Victory!"
        score={moves}
        scoreLabel="Moves to complete"
        accentColor="purple"
        onPlayAgain={initializeGame}
      />
    </div>
  )
}
