"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWordscape } from "@/hooks/use-wordscape"
import { UnifiedHUD, GameOverModal, StartScreen } from "./shared"
import WordWheel from "./wordscape/word-wheel"
import CrosswordGrid from "./wordscape/crossword-grid"
import { Lightbulb, Shuffle } from "lucide-react"
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"

export default function Wordscape() {
  const {
    currentLevel,
    grid,
    score,
    status,
    currentSelection,
    setCurrentSelection,
    submitSelection,
    nextLevel,
    useHint,
    foundWords
  } = useWordscape()

  const { updateScore, liveTime } = useGameSessionIntegration("wordscape")
  const [shuffledLetters, setShuffledLetters] = useState(currentLevel.letters)

  useEffect(() => {
    setShuffledLetters(currentLevel.letters)
  }, [currentLevel])

  useEffect(() => {
    updateScore(score)
  }, [score, updateScore])

  const handleShuffle = () => {
    setShuffledLetters([...shuffledLetters].sort(() => Math.random() - 0.5))
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Unified HUD */}
      <UnifiedHUD
        stats={[
          { label: "Level", value: currentLevel.id, color: "emerald" },
          { label: "Score", value: score, color: "white" },
          { label: "Words", value: `${foundWords.length}/${currentLevel.words.length}`, color: "cyan" },
        ]}
        className="w-full max-w-md"
      />

      {/* Main Game Area */}
      <div className="flex-grow flex flex-col items-center justify-center w-full min-h-0 gap-8 py-4">
        {/* Crossword Grid */}
        <CrosswordGrid grid={grid} levelId={currentLevel.id} />

        {/* Current Selection Display */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentSelection && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="bg-emerald-500 text-zinc-950 px-6 py-2 rounded-full font-black text-2xl tracking-widest shadow-lg shadow-emerald-500/20"
              >
                {currentSelection}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Controls */}
        <div className="relative flex items-center justify-center">
          {/* Hint Button */}
          <button
            onClick={useHint}
            className="absolute left-[-80px] sm:left-[-100px] w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-amber-400 hover:bg-zinc-800 transition-colors shadow-lg"
            title="Hint (Costs 20 pts)"
          >
            <Lightbulb size={24} />
          </button>

          {/* Shuffle Button */}
          <button
            onClick={handleShuffle}
            className="absolute right-[-80px] sm:right-[-100px] w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-cyan-400 hover:bg-zinc-800 transition-colors shadow-lg"
            title="Shuffle"
          >
            <Shuffle size={24} />
          </button>

          <WordWheel
            letters={shuffledLetters}
            onSelectionChange={setCurrentSelection}
            onSelectionComplete={submitSelection}
          />
        </div>
      </div>

      {/* Level Complete Modal */}
      <GameOverModal
        isOpen={status === "level_complete"}
        title="Level Complete!"
        score={score}
        scoreLabel="Total Score"
        accentColor="emerald"
        onPlayAgain={nextLevel}
        buttonText="Next Level"
        additionalContent={
          <div className="text-zinc-400 mb-6">
            Congratulations! You've found all the words.
          </div>
        }
      />
    </div>
  )
}
