"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
      <div className="absolute top-6 left-0 right-0 flex justify-center z-10">
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-2xl px-6 py-3">
          <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Moves</div>
          <div className="text-3xl font-black text-purple-400">{moves}</div>
        </div>
      </div>

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
      <AnimatePresence>
        {gameWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-zinc-900 border-2 border-purple-500 rounded-3xl p-10 text-center"
            >
              <h2 className="text-5xl font-black text-purple-400 mb-4">Victory!</h2>
              <div className="text-6xl font-black text-white mb-6">{moves}</div>
              <p className="text-zinc-400 mb-8">Moves to complete</p>
              <button
                onClick={initializeGame}
                className="bg-purple-500 hover:bg-purple-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors"
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
