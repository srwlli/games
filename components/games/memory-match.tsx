"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { GameOverModal, StartScreen, CountdownOverlay, UnifiedHUD } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useDelayedAction } from "@/hooks/use-delayed-action"
import { getGameIcon } from "@/lib/game-icons"

const MEMORY_MATCH_ICONS = ["Gamepad2", "Target", "Dice6", "PartyPopper", "Palette", "Theater", "Guitar", "Music4"]

export default function MemoryMatch() {
  const [cards, setCards] = useState<Array<{ id: number; iconName: string; flipped: boolean; matched: boolean; animateSuccess?: boolean; animateShake?: boolean }>>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [shouldCheckMatch, setShouldCheckMatch] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownStartedRef = useRef(false)
  const { isPlaying, isPaused, isGameOver, pause, resume, reset, start, gameOver } = useGameState({
    initialState: "idle",
  })

  const initializeGame = useCallback(() => {
    const doubled = [...MEMORY_MATCH_ICONS, ...MEMORY_MATCH_ICONS]
    const shuffled = doubled
      .sort(() => Math.random() - 0.5)
      .map((iconName, idx) => ({
        id: idx,
        iconName,
        flipped: false,
        matched: false,
        animateSuccess: false,
        animateShake: false,
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
      
      if (cards[first]?.iconName === cards[second]?.iconName) {
        // Match success - trigger success animation
        newCards[first] = { ...newCards[first], matched: true, animateSuccess: true, flipped: true }
        newCards[second] = { ...newCards[second], matched: true, animateSuccess: true, flipped: true }

        // Clear animation flag after animation completes
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === first || c.id === second ? { ...c, animateSuccess: false } : c)))
        }, 600)

        if (newCards.every((card) => card.matched)) {
          gameOver()
        }
      } else {
        // Mismatch - trigger shake animation, then flip back
        newCards[first] = { ...newCards[first], animateShake: true }
        newCards[second] = { ...newCards[second], animateShake: true }
        
        // After shake animation, flip back
        setTimeout(() => {
          setCards((prev) => prev.map((c) => 
            c.id === first || c.id === second 
              ? { ...c, flipped: false, animateShake: false }
              : c
          ))
        }, 500)
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
    <div className="w-full h-full bg-gradient-to-br from-purple-950 via-zinc-950 to-purple-950 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
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

      {/* Unified HUD */}
      <UnifiedHUD
        stats={[
          { label: "Moves", value: moves, color: "purple" },
          { label: "Pairs", value: `${cards.filter((c) => c.matched).length / 2}/${MEMORY_MATCH_ICONS.length}`, color: "purple" },
        ]}
        className="absolute top-20 left-0 right-0 z-10"
      />

      {/* Card Grid */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg w-full px-4" style={{ perspective: "1000px" }}>
        {cards.map((card) => {
          const Icon = getGameIcon(card.iconName)
          const isFlipped = card.flipped || card.matched
          const canInteract = isPlaying && countdown === null && !isFlipped && flippedCards.length < 2
          
          return (
            <div key={card.id} className="aspect-square" style={{ transformStyle: "preserve-3d" }}>
              <motion.button
                onClick={() => handleCardClick(card.id)}
                disabled={!canInteract}
                className="w-full h-full relative cursor-pointer disabled:cursor-not-allowed"
                style={{ transformStyle: "preserve-3d" }}
                whileHover={canInteract ? { scale: 1.08, y: -2 } : {}}
                whileTap={canInteract ? { scale: 0.92 } : {}}
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                  scale: card.animateSuccess ? [1, 1.15, 1] : 1,
                  x: card.animateShake ? [0, -10, 10, -10, 10, 0] : 0,
                }}
                transition={{
                  rotateY: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                  scale: card.animateSuccess ? { duration: 0.6, ease: "easeOut" } : { duration: 0 },
                  x: card.animateShake ? { duration: 0.5, ease: "easeInOut" } : { duration: 0 },
                }}
                initial={false}
              >
                {/* Card Front (Back Design) */}
                <div
                  className="absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden shadow-lg"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(0deg)",
                    background: "linear-gradient(145deg, #7c3aed 0%, #6b21a8 50%, #581c87 100%)",
                    border: "3px solid rgba(196, 181, 253, 0.4)",
                    boxShadow: canInteract 
                      ? "0 10px 25px -5px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 4px 15px -5px rgba(124, 58, 237, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <pattern id={`pattern-${card.id}`} x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                          <circle cx="12.5" cy="12.5" r="1" fill="rgba(255,255,255,0.2)" />
                          <line x1="0" y1="12.5" x2="25" y2="12.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                          <line x1="12.5" y1="0" x2="12.5" y2="25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100" height="100" fill={`url(#pattern-${card.id})`} />
                    </svg>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Card Back (Icon Content) */}
                <div
                  className={`absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden ${
                    card.matched
                      ? "bg-gradient-to-br from-purple-400 to-purple-600 shadow-2xl shadow-purple-500/60"
                      : "bg-gradient-to-br from-purple-500 to-purple-700 shadow-xl shadow-purple-500/40"
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    border: card.animateShake 
                      ? "3px solid rgba(239, 68, 68, 0.9)" 
                      : card.matched
                      ? "3px solid rgba(196, 181, 253, 0.6)"
                      : "3px solid rgba(196, 181, 253, 0.4)",
                    boxShadow: card.matched
                      ? "0 20px 40px -10px rgba(124, 58, 237, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      : "0 10px 25px -5px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    <Icon size={52} className="text-white drop-shadow-lg" strokeWidth={2.5} />
                  </div>
                  
                  {/* Success Glow for Matched Cards */}
                  {card.matched && (
                    <div className="absolute inset-0 bg-purple-400/30 animate-pulse pointer-events-none" />
                  )}
                </div>
              </motion.button>
            </div>
          )
        })}
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
