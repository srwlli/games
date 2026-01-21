"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GameOverModal, UnifiedHUD } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useInterval } from "@/hooks/use-interval"
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"

// Game phases
type FishingPhase = "idle" | "casting" | "waiting" | "hook-set" | "battling" | "results"

// Fish types with rarity
type FishRarity = "common" | "uncommon" | "rare" | "epic" | "legendary"

interface Fish {
  id: number
  type: string
  rarity: FishRarity
  emoji: string
  points: number
  weight: number
}

const FISH_DATA: Record<FishRarity, { types: string[]; emoji: string; points: number }> = {
  common: { types: ["Bass", "Perch", "Carp"], emoji: "🐟", points: 10 },
  uncommon: { types: ["Trout", "Salmon", "Cod"], emoji: "🐠", points: 25 },
  rare: { types: ["Tuna", "Shark", "Swordfish"], emoji: "🦈", points: 50 },
  epic: { types: ["Octopus", "Squid", "Ray"], emoji: "🐙", points: 100 },
  legendary: { types: ["Whale", "Marlin", "Kraken"], emoji: "🐋", points: 250 },
}

export default function Fishing() {
  const [score, setScore] = useState(0)
  const [fishCaught, setFishCaught] = useState<Fish[]>([])
  const [phase, setPhase] = useState<FishingPhase>("idle")
  const [combo, setCombo] = useState(0)
  const [lastFish, setLastFish] = useState<Fish | null>(null)

  // Unified Mechanics State
  const [castPower, setCastPower] = useState(0)
  const [castAccuracy, setCastAccuracy] = useState(50)
  const accuracyDirectionRef = useRef(1)
  const [castSubPhase, setCastSubPhase] = useState<"power" | "prepare" | "accuracy">("power")
  const [isChargingCast, setIsChargingCast] = useState(false)
  const [fishTension, setFishTension] = useState(0)
  const [fishStamina, setFishStamina] = useState(100)
  const [isReeling, setIsReeling] = useState(false)

  const { isPlaying, isPaused, isGameOver, pause, resume, reset, start } =
    useGameState({
      initialState: "idle",
    })
  const { updateScore, setTimerPaused, liveTime } = useGameSessionIntegration("fishing")

  const resetGame = useCallback(() => {
    setScore(0)
    setFishCaught([])
    setPhase("idle")
    setCombo(0)
    setLastFish(null)
    reset()
    start()
  }, [reset, start])

  const startCasting = useCallback(() => {
    setPhase("casting")
    setCastSubPhase("power")
    setCastPower(0)
    setCastAccuracy(0)
    accuracyDirectionRef.current = 1
    start()
  }, [start])

  const handleCatch = useCallback(
    (fish: Fish) => {
      const basePoints = fish.points
      const comboMultiplier = Math.min(combo + 1, 5)
      const points = basePoints * comboMultiplier
      const newScore = score + points
      setScore(newScore)
      updateScore(newScore)
      setFishCaught((prev) => [...prev, fish])
      setLastFish(fish)
      setCombo((prev) => prev + 1)
      setPhase("results")

      setTimeout(() => {
        setPhase("idle")
      }, 3000)
    },
    [combo, score, updateScore],
  )

  const handleMiss = useCallback(() => {
    setCombo(0)
    setLastFish(null)
    setPhase("results")

    setTimeout(() => {
      setPhase("idle")
    }, 2000)
  }, [])

  // --- Game Logic ---

  // 1. Casting Logic
  useInterval(
    () => {
      if (phase === "casting") {
        if (castSubPhase === "power" && isChargingCast) {
          setCastPower((prev) => (prev < 100 ? prev + 3 : prev))
        }

        if (castSubPhase === "accuracy") {
          setCastAccuracy((prev) => {
            let next = prev + accuracyDirectionRef.current * 4
            if (next >= 100) {
              accuracyDirectionRef.current = -1
              next = 100
            } else if (next <= 0) {
              accuracyDirectionRef.current = 1
              next = 0
            }
            return next
          })
        }
      }
    },
    30,
    phase === "casting" && isPlaying,
  )

  // 1b. Casting Prep Timer
  useEffect(() => {
    if (phase === "casting" && castSubPhase === "prepare") {
      const timer = setTimeout(() => {
        setCastSubPhase("accuracy")
      }, 1000) // 1 second to get ready
      return () => clearTimeout(timer)
    }
  }, [phase, castSubPhase])

  // 2. Waiting Logic (Nibbles)
  useEffect(() => {
    if (phase === "waiting" && isPlaying) {
      const waitTime = 1500 + Math.random() * 3000
      const timer = setTimeout(() => {
        setPhase("hook-set")
      }, waitTime)
      return () => clearTimeout(timer)
    }
  }, [phase, isPlaying])

  // 3. Battle Logic
  useInterval(
    () => {
      if (phase === "battling" && isPlaying) {
        if (isReeling) {
          setFishTension((prev) => Math.min(100, prev + 2.5))
          setFishStamina((prev) => Math.max(0, prev - 2))
        } else {
          setFishTension((prev) => Math.max(0, prev - 1.5))
          setFishStamina((prev) => Math.min(100, prev + 0.5))
        }

        if (fishTension >= 100) {
          handleMiss()
        } else if (fishStamina <= 0) {
          const rarities: FishRarity[] = ["common", "uncommon", "rare", "epic", "legendary"]

          // Use cast accuracy (0-100, 50 is best) to influence rarity
          // Distance from 50 (center)
          const accuracyOffset = Math.abs(castAccuracy - 50)
          const accuracyScore = 1 - (accuracyOffset / 50) // 1.0 is perfect, 0.0 is edge

          const weight = Math.random() * accuracyScore // Better accuracy = higher rarity chance
          const rarity = weight > 0.9 ? "legendary" : weight > 0.7 ? "epic" : weight > 0.5 ? "rare" : weight > 0.2 ? "uncommon" : "common"

          const data = FISH_DATA[rarity]
          const type = data.types[Math.floor(Math.random() * data.types.length)]

          handleCatch({
            id: Date.now(),
            type,
            rarity,
            emoji: data.emoji,
            points: Math.floor(data.points * (1 + accuracyScore)),
            weight: parseFloat((Math.random() * 50 * (1 + accuracyScore)).toFixed(2)),
          })
        }
      }
    },
    50,
    phase === "battling" && isPlaying,
  )

  // --- Input Handlers ---

  const handleInteractionStart = useCallback(() => {
    if (!isPlaying || isPaused) return

    if (phase === "idle") {
      startCasting()
    } else if (phase === "casting") {
      if (castSubPhase === "power") {
        setIsChargingCast(true)
      } else if (castSubPhase === "accuracy") {
        setPhase("waiting")
      }
    } else if (phase === "hook-set") {
      setPhase("battling")
      setFishTension(20)
      setFishStamina(100)
    } else if (phase === "battling") {
      setIsReeling(true)
    }
  }, [phase, isPlaying, isPaused, startCasting, castSubPhase])

  const handleInteractionEnd = useCallback(() => {
    if (phase === "casting") {
      if (castSubPhase === "power") {
        setIsChargingCast(false)
        setCastSubPhase("prepare")
      }
    } else if (phase === "battling") {
      setIsReeling(false)
    }
  }, [phase, castSubPhase, isChargingCast])

  // Hook-set Timeout
  useEffect(() => {
    if (phase === "hook-set") {
      const timer = setTimeout(() => {
        if (phase === "hook-set") handleMiss()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, handleMiss])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        handleInteractionStart()
      }
      if (e.key === "p" || e.key === "Escape") {
        if (isPlaying) pause()
        else if (phase !== "idle") resume()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        handleInteractionEnd()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleInteractionStart, handleInteractionEnd, isPlaying, pause, resume, phase])

  // Sync session timer
  useEffect(() => {
    setTimerPaused(isPaused || phase === "idle" || phase === "results")
  }, [isPaused, phase, setTimerPaused])

  return (
    <div
      className="w-full h-full bg-gradient-to-br from-cyan-950 to-blue-950 flex flex-col items-center justify-between relative overflow-hidden select-none touch-none p-4 sm:p-6"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      {/* Unified HUD */}
      <UnifiedHUD
        stats={[
          { label: "Score", value: score, color: "cyan" },
          { label: "Time", value: Math.floor(liveTime / 1000) + "s", color: "orange" },
          { label: "Caught", value: fishCaught.length, color: "white" },
          { label: "Combo", value: `x${combo}`, color: combo > 0 ? "amber" : "white" },
        ]}
        className="w-full max-w-md"
      />

      <div className="flex-grow flex items-center justify-center w-full min-h-0 py-4">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center p-8 sm:p-12 bg-zinc-900/90 border-2 border-cyan-500/50 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🎣</div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tighter">FISHING</h2>
              <p className="text-zinc-400 mb-6 sm:mb-8 text-sm">Tap or Space to cast!</p>
              <button
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95"
                onClick={(e) => {
                  e.stopPropagation()
                  startCasting()
                }}
              >
                CAST LINE
              </button>
            </motion.div>
          )}

          {phase === "casting" && (
            <motion.div key="casting" className="w-full max-w-md aspect-square max-h-[400px] flex flex-col items-center justify-between relative bg-black/20 rounded-3xl p-6 sm:p-8 backdrop-blur-sm border border-white/5 mx-4">
              <div className="flex w-full h-full gap-8">
                {/* Visual Label */}
                <div className="flex-1 flex flex-col justify-center items-center">
                  <AnimatePresence mode="wait">
                    {castSubPhase === "power" && (
                      <motion.div
                        key="power-label"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="text-center"
                      >
                        <h3 className="text-white text-5xl font-black italic tracking-tighter uppercase mb-2">Power</h3>
                        <p className="text-zinc-400 font-bold animate-pulse tracking-widest uppercase text-xs">Hold for Power</p>
                      </motion.div>
                    )}
                    {castSubPhase === "prepare" && (
                      <motion.div
                        key="prep-label"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <h3 className="text-cyan-400 text-5xl font-black italic tracking-tighter uppercase mb-2">Ready?</h3>
                        <p className="text-zinc-400 font-bold tracking-widest uppercase text-xs">Timing is next...</p>
                      </motion.div>
                    )}
                    {castSubPhase === "accuracy" && (
                      <motion.div
                        key="accuracy-label"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                      >
                        <h3 className="text-white text-5xl font-black italic tracking-tighter uppercase mb-2">Aim</h3>
                        <p className="text-red-500 font-black animate-ping tracking-widest uppercase text-xs">Tap for Accuracy!</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Vertical Power Bar */}
                <div className="w-12 h-full bg-zinc-900 rounded-full p-1.5 border-4 border-zinc-800 relative shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 flex flex-col justify-end">
                    <motion.div
                      className="w-full bg-gradient-to-t from-cyan-400 via-blue-500 to-indigo-600 rounded-full"
                      style={{ height: `${castPower}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Horizontal Accuracy Bar */}
              <div className="w-full mt-8 space-y-2">
                <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                  <span>Inaccurate</span>
                  <span className="text-cyan-400 text-sm">Target</span>
                  <span>Inaccurate</span>
                </div>
                <div className="relative h-4 bg-zinc-900 rounded-full border-2 border-zinc-800 overflow-hidden shadow-inner flex items-center">
                  {/* Target Zone (Center) */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-8 h-full bg-cyan-500/20 border-x-2 border-cyan-400/50" />

                  {/* Bouncing Pointer */}
                  <motion.div
                    className="absolute w-2 h-full bg-white shadow-[0_0_10px_white] z-10"
                    style={{ left: `${castAccuracy}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {phase === "waiting" && (
            <motion.div key="waiting" className="text-center">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-9xl mb-8"
              >
                🌊
              </motion.div>
              <h3 className="text-white text-3xl font-black italic mb-2 tracking-tighter uppercase">Waiting...</h3>
              <p className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-xs">Watching for nibbles</p>
            </motion.div>
          )}

          {phase === "hook-set" && (
            <motion.div
              key="hook-set"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: 1 }}
              className="text-center"
            >
              <div className="text-9xl mb-4 drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">❗</div>
              <h3 className="text-white text-6xl font-black italic mb-2 tracking-tighter uppercase">Bite!</h3>
              <p className="text-red-500 text-2xl font-black animate-ping uppercase tracking-widest">Hook it!</p>
            </motion.div>
          )}

          {phase === "battling" && (
            <motion.div key="battling" className="w-full max-w-md space-y-8">
              <div className="text-center mb-4">
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: isReeling ? [0, 10, -10, 0] : 0 }}
                  transition={{ repeat: Infinity, duration: 0.4 }}
                  className="text-9xl inline-block drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  🐟
                </motion.div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                    <span>Line Tension</span>
                    <span className={fishTension > 80 ? "text-red-500 animate-pulse" : ""}>{Math.floor(fishTension)}%</span>
                  </div>
                  <div className="h-4 bg-zinc-950 rounded-full p-1 border border-zinc-800 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${fishTension}%`,
                        backgroundColor: fishTension > 85 ? "#ef4444" : fishTension > 60 ? "#f97316" : "#06b6d4"
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                    <span>Fish Stamina</span>
                    <span>{Math.floor(fishStamina)}%</span>
                  </div>
                  <div className="h-4 bg-zinc-950 rounded-full p-1 border border-zinc-800 shadow-inner">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${fishStamina}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-center text-white/30 text-xs font-black tracking-[0.5em] uppercase">
                {isReeling ? "REELING..." : "Hold to Reel"}
              </p>
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center p-12 bg-zinc-900/90 border-2 border-cyan-500/50 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              {lastFish ? (
                <>
                  <div className="text-9xl mb-6 scale-125 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]">
                    {lastFish.emoji}
                  </div>
                  <h3 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">{lastFish.type}</h3>
                  <div className="flex justify-center gap-3 mb-8">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-cyan-500/30">
                      {lastFish.rarity}
                    </span>
                    <span className="px-3 py-1 bg-white/5 text-white/50 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {lastFish.weight}kg
                    </span>
                  </div>
                  <div className="text-3xl font-black text-emerald-400 tracking-tighter italic shadow-emerald-500/20 drop-shadow-sm">
                    +{lastFish.points * Math.min(combo, 5)} <span className="text-xs uppercase ml-1">Pts</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-9xl mb-6 grayscale opacity-20">💨</div>
                  <h3 className="text-4xl font-black text-zinc-600 mb-2 tracking-tighter uppercase italic">Got Away</h3>
                  <p className="text-zinc-700 font-bold text-sm tracking-widest uppercase">The fish escaped!</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-50"
          >
            <div className="text-white text-6xl font-black italic tracking-tighter uppercase">Paused</div>
          </motion.div>
        )}
      </AnimatePresence>

      <GameOverModal
        isOpen={isGameOver}
        title="SESSION COMPLETE"
        score={score}
        scoreLabel="Total Fishing Score"
        accentColor="cyan"
        onPlayAgain={resetGame}
        additionalContent={
          <div className="text-zinc-500 font-bold mb-10 uppercase tracking-[0.3em] text-[10px]">
            Fish Caught: <span className="text-white ml-2">{fishCaught.length}</span>
          </div>
        }
      />
    </div>
  )
}
