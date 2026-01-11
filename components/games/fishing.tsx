"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useInterval } from "@/hooks/use-interval"
import { useCountdown } from "@/hooks/use-countdown"
import { useDelayedAction } from "@/hooks/use-delayed-action"

// Game phases
type FishingPhase = "idle" | "casting" | "reeling" | "catching" | "complete"

// Current pattern being played
type FishingPattern =
  | "single-bar-timing" // Pattern 1
  | "tension-meter" // Pattern 2
  | "lane-based" // Pattern 3
  | "drag-path" // Pattern 4
  | "qte-reeling" // Pattern 5

// Fish types with rarity
type FishRarity = "common" | "uncommon" | "rare" | "epic" | "legendary"

interface Fish {
  id: number
  type: string
  rarity: FishRarity
  emoji: string
  points: number
  pattern: FishingPattern
}

const FISH_TYPES: Record<
  FishRarity,
  { emoji: string; points: number; patterns: FishingPattern[] }
> = {
  common: { emoji: "🐟", points: 10, patterns: ["single-bar-timing", "lane-based"] },
  uncommon: { emoji: "🐠", points: 25, patterns: ["tension-meter", "drag-path"] },
  rare: { emoji: "🦈", points: 50, patterns: ["single-bar-timing", "qte-reeling"] },
  epic: { emoji: "🐙", points: 100, patterns: ["tension-meter", "lane-based"] },
  legendary: { emoji: "🐋", points: 250, patterns: ["drag-path", "qte-reeling"] },
}

interface PatternProps {
  onCatch: (fish: Fish) => void
  onMiss: () => void
  isPlaying: boolean
}

export default function Fishing() {
  const [score, setScore] = useState(0)
  const [fishCaught, setFishCaught] = useState<Fish[]>([])
  const [currentPattern, setCurrentPattern] = useState<FishingPattern | null>(null)
  const [phase, setPhase] = useState<FishingPhase>("idle")
  const [combo, setCombo] = useState(0)
  const { isPlaying, isPaused, isGameOver, pause, resume, gameOver, reset, start } =
    useGameState({
      initialState: "idle",
    })

  const resetGame = useCallback(() => {
    setScore(0)
    setFishCaught([])
    setCurrentPattern(null)
    setPhase("idle")
    setCombo(0)
    reset()
    start()
  }, [reset, start])

  // Pattern selection handler
  const selectPattern = useCallback(
    (pattern: FishingPattern) => {
      setCurrentPattern(pattern)
      setPhase("casting")
      start()
    },
    [start],
  )

  // Random pattern selection
  const selectRandomPattern = useCallback(() => {
    const patterns: FishingPattern[] = [
      "single-bar-timing",
      "tension-meter",
      "lane-based",
      "drag-path",
      "qte-reeling",
    ]
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)]
    selectPattern(randomPattern)
  }, [selectPattern])

  // Handle successful catch
  const handleCatch = useCallback(
    (fish: Fish) => {
      const basePoints = fish.points
      const comboMultiplier = Math.min(combo + 1, 5) // Max 5x combo
      const points = basePoints * comboMultiplier
      setScore((prev) => prev + points)
      setFishCaught((prev) => [...prev, fish])
      setCombo((prev) => prev + 1)
      setPhase("complete")
      
      // Auto-return to pattern selection after a delay
      setTimeout(() => {
        setPhase("idle")
        setCurrentPattern(null)
      }, 2000)
    },
    [combo],
  )

  // Handle miss
  const handleMiss = useCallback(() => {
    setCombo(0)
    setPhase("complete")
    
    // Auto-return to pattern selection after a delay
    setTimeout(() => {
      setPhase("idle")
      setCurrentPattern(null)
    }, 2000)
  }, [])

  // Render pattern based on current selection
  const renderPattern = () => {
    if (!currentPattern) return null

    const patternProps: PatternProps = {
      onCatch: handleCatch,
      onMiss: handleMiss,
      isPlaying,
    }

    switch (currentPattern) {
      case "single-bar-timing":
        return <SingleBarTimingPattern {...patternProps} />
      case "tension-meter":
        return <TensionMeterPattern {...patternProps} />
      case "lane-based":
        return <LaneBasedPattern {...patternProps} />
      case "drag-path":
        return <DragPathPattern {...patternProps} />
      case "qte-reeling":
        return <QTEReelingPattern {...patternProps} />
      default:
        return null
    }
  }

  // Pause/resume keyboard handler
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
    <div className="w-full h-full bg-gradient-to-br from-cyan-950 to-blue-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Stats */}
      <StatsBar
        stats={[
          { label: "Score", value: score, color: "cyan" },
          { label: "Caught", value: fishCaught.length, color: "white" },
          { label: "Combo", value: `x${combo}`, color: combo > 0 ? "amber" : "white" },
        ]}
        layout="absolute"
        position="top"
      />

      {/* Pattern Selection Screen (Idle) */}
      {phase === "idle" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-8 bg-zinc-900/90 border-2 border-cyan-500/50 rounded-3xl max-w-md w-full"
        >
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">🎣 FISHING</h2>
          <p className="text-zinc-400 mb-8">Choose a fishing technique</p>

          <div className="space-y-3">
            <button
              onClick={() => selectPattern("single-bar-timing")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
            >
              Single-Bar Timing
            </button>
            <button
              onClick={() => selectPattern("tension-meter")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
            >
              Tension Meter
            </button>
            <button
              onClick={() => selectPattern("lane-based")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
            >
              Lane-Based
            </button>
            <button
              onClick={() => selectPattern("drag-path")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
            >
              Drag-Path
            </button>
            <button
              onClick={() => selectPattern("qte-reeling")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
            >
              QTE Reeling
            </button>
            <button
              onClick={selectRandomPattern}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all mt-4"
            >
              Random Pattern
            </button>
          </div>
        </motion.div>
      )}

      {/* Pattern Game Area */}
      {phase !== "idle" && phase !== "complete" && renderPattern()}

      {/* Catch/Miss Result Screen */}
      {phase === "complete" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-zinc-900/90 border-2 border-cyan-500/50 rounded-3xl max-w-md w-full"
        >
          {fishCaught.length > 0 && (
            <div>
              <div className="text-6xl mb-4">
                {fishCaught[fishCaught.length - 1]?.emoji}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Fish Caught!</h3>
              <p className="text-zinc-400">
                {fishCaught[fishCaught.length - 1]?.type} - {fishCaught[fishCaught.length - 1]?.rarity}
              </p>
            </div>
          )}
          {fishCaught.length === 0 && (
            <div>
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-white mb-2">Missed!</h3>
              <p className="text-zinc-400">Try again</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="text-white text-3xl font-bold">Paused</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        title="Game Over"
        score={score}
        scoreLabel="Final Score"
        accentColor="cyan"
        onPlayAgain={resetGame}
        additionalContent={
          <div className="text-zinc-400 mb-6">
            Fish Caught: {fishCaught.length}
          </div>
        }
      />
    </div>
  )
}

// Pattern 1: Single-Bar Timing Cast & Reel
function SingleBarTimingPattern({ onCatch, onMiss, isPlaying }: PatternProps) {
  const [castPower, setCastPower] = useState(0)
  const [castGreenZone, setCastGreenZone] = useState({ start: 0, end: 0 })
  const [isCasting, setIsCasting] = useState(false)
  const [castPhase, setCastPhase] = useState<"casting" | "reeling">("casting")

  // Reel state
  const [reelPosition, setReelPosition] = useState(0)
  const [reelGreenZones, setReelGreenZones] = useState<Array<{ start: number; end: number }>>([])
  const [fishStamina, setFishStamina] = useState(100)
  const [lineTension, setLineTension] = useState(0)

  // Initialize cast green zone
  useEffect(() => {
    if (castPhase === "casting") {
      const start = 50 + Math.random() * 20 // 50-70%
      const end = start + 15 // 15% wide zone
      setCastGreenZone({ start, end })
      setCastPower(0)
    }
  }, [castPhase])

  // Cast power fill
  useInterval(
    () => {
      if (isCasting && castPhase === "casting") {
        setCastPower((prev) => Math.min(prev + 2, 100))
      }
    },
    50,
    isCasting && castPhase === "casting" && isPlaying,
  )

  // Reel bar movement
  useInterval(
    () => {
      if (castPhase === "reeling" && isPlaying) {
        setReelPosition((prev) => (prev + 3) % 100)
      }
    },
    50,
    castPhase === "reeling" && isPlaying,
  )

  // Line tension increase
  useInterval(
    () => {
      if (castPhase === "reeling" && isPlaying) {
        setLineTension((prev) => Math.min(prev + 1, 100))
        if (lineTension >= 100) {
          onMiss()
        }
      }
    },
    200,
    castPhase === "reeling" && isPlaying,
  )

  const handleCast = () => {
    if (castPhase === "casting") {
      setIsCasting(true)
    }
  }

  const handleRelease = () => {
    if (castPhase === "casting" && isCasting) {
      setIsCasting(false)
      const inGreenZone =
        castPower >= castGreenZone.start && castPower <= castGreenZone.end
      if (inGreenZone) {
        // Good cast - determine fish rarity based on accuracy
        const accuracy = Math.abs(castPower - (castGreenZone.start + castGreenZone.end) / 2)
        const rarity: FishRarity =
          accuracy < 2 ? "rare" : accuracy < 5 ? "uncommon" : "common"
        const fishPattern = FISH_TYPES[rarity].patterns[0] as FishingPattern
        setCastPhase("reeling")
        // Initialize reel green zones
        const zones: Array<{ start: number; end: number }> = []
        for (let i = 0; i < 3; i++) {
          const start = Math.random() * 80
          zones.push({ start, end: start + 10 })
        }
        setReelGreenZones(zones)
        setFishStamina(100)
        setLineTension(0)
      } else {
        // Poor cast
        onMiss()
      }
    }
  }

  const handleReelStop = () => {
    if (castPhase === "reeling") {
      const inZone = reelGreenZones.some(
        (zone) => reelPosition >= zone.start && reelPosition <= zone.end,
      )
      if (inZone) {
        setFishStamina((prev) => {
          const newStamina = Math.max(0, prev - 15)
          if (newStamina <= 0) {
            // Fish caught!
            const rarity: FishRarity = "common" // Simplified for now
            const fish: Fish = {
              id: Date.now(),
              type: "Bass",
              rarity,
              emoji: FISH_TYPES[rarity].emoji,
              points: FISH_TYPES[rarity].points,
              pattern: "single-bar-timing",
            }
            onCatch(fish)
          }
          return newStamina
        })
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      {castPhase === "casting" ? (
        <div className="w-full max-w-md">
          <h3 className="text-white text-xl font-bold mb-4 text-center">Cast!</h3>
          <div className="relative h-12 bg-zinc-800 rounded-full overflow-hidden mb-4">
            {/* Green zone */}
            <div
              className="absolute h-full bg-emerald-500/50 border-2 border-emerald-400"
              style={{
                left: `${castGreenZone.start}%`,
                width: `${castGreenZone.end - castGreenZone.start}%`,
              }}
            />
            {/* Power bar */}
            <div
              className="absolute h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all"
              style={{ width: `${castPower}%` }}
            />
          </div>
          <button
            onMouseDown={handleCast}
            onMouseUp={handleRelease}
            onTouchStart={handleCast}
            onTouchEnd={handleRelease}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl"
          >
            {isCasting ? "Release!" : "Hold to Cast"}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <h3 className="text-white text-xl font-bold mb-4 text-center">Reel!</h3>
          {/* Fish stamina */}
          <div className="mb-2">
            <div className="text-white text-sm mb-1">Fish Stamina</div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${fishStamina}%` }}
              />
            </div>
          </div>
          {/* Reel bar */}
          <div className="relative h-12 bg-zinc-800 rounded-full overflow-hidden mb-2">
            {reelGreenZones.map((zone, i) => (
              <div
                key={i}
                className="absolute h-full bg-emerald-500/50 border-2 border-emerald-400"
                style={{
                  left: `${zone.start}%`,
                  width: `${zone.end - zone.start}%`,
                }}
              />
            ))}
            <div
              className="absolute h-full w-2 bg-white transition-all"
              style={{ left: `${reelPosition}%` }}
            />
          </div>
          {/* Line tension */}
          <div className="mb-4">
            <div className="text-white text-sm mb-1">Line Tension</div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${lineTension}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleReelStop}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl"
          >
            Stop Reel
          </button>
        </div>
      )}
    </div>
  )
}

// Pattern 2: Tension Meter Slider
function TensionMeterPattern({ onCatch, onMiss, isPlaying }: PatternProps) {
  const [meterPosition, setMeterPosition] = useState(50) // 0-100, 50 = safe zone
  const [catchProgress, setCatchProgress] = useState(0)
  const [fishPullPattern, setFishPullPattern] = useState<"smooth" | "jerky" | "fast">("smooth")
  const [isHolding, setIsHolding] = useState(false)
  const pullDirectionRef = useRef(1) // 1 for up, -1 for down

  // Initialize fish pull pattern
  useEffect(() => {
    const patterns: Array<"smooth" | "jerky" | "fast"> = ["smooth", "jerky", "fast"]
    setFishPullPattern(patterns[Math.floor(Math.random() * patterns.length)])
  }, [])

  // Meter oscillation based on fish pull pattern
  useInterval(
    () => {
      if (!isPlaying) return

      let pullAmount = 0
      switch (fishPullPattern) {
        case "smooth":
          pullAmount = 1.5
          break
        case "jerky":
          pullAmount = Math.random() > 0.7 ? 4 : 1
          break
        case "fast":
          pullAmount = 2.5
          break
      }

      // Oscillate meter
      setMeterPosition((prev) => {
        let newPos = prev + pullDirectionRef.current * pullAmount
        if (newPos > 80 || newPos < 20) {
          pullDirectionRef.current *= -1
          newPos = Math.max(20, Math.min(80, newPos))
        }
        return newPos
      })
    },
    50,
    isPlaying,
  )

  // Player input nudges meter toward safe zone
  useInterval(
    () => {
      if (isHolding && isPlaying) {
        setMeterPosition((prev) => {
          const target = 50 // Safe zone center
          const diff = target - prev
          return prev + diff * 0.1 // Nudge 10% toward target
        })
      }
    },
    50,
    isHolding && isPlaying,
  )

  // Catch progress fills when in safe zone
  useInterval(
    () => {
      if (isPlaying) {
        const inSafeZone = meterPosition >= 40 && meterPosition <= 60
        if (inSafeZone) {
          setCatchProgress((prev) => {
            const newProgress = prev + 1
            if (newProgress >= 100) {
              // Fish caught!
              const rarity: FishRarity = "uncommon"
              const fish: Fish = {
                id: Date.now(),
                type: "Trout",
                rarity,
                emoji: FISH_TYPES[rarity].emoji,
                points: FISH_TYPES[rarity].points,
                pattern: "tension-meter",
              }
              onCatch(fish)
            }
            return newProgress
          })
        }
      }
    },
    100,
    isPlaying,
  )

  // Check for line break (meter hits limit)
  useEffect(() => {
    if (meterPosition <= 5 || meterPosition >= 95) {
      onMiss()
    }
  }, [meterPosition, onMiss])

  const handleHold = () => {
    setIsHolding(true)
  }

  const handleRelease = () => {
    setIsHolding(false)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <h3 className="text-white text-xl font-bold mb-4 text-center">Tension Meter!</h3>

      <div className="flex items-center gap-8">
        {/* Vertical meter */}
        <div className="relative w-16 h-64 bg-zinc-800 rounded-full overflow-hidden">
          {/* Safe zone (green) */}
          <div className="absolute w-full bg-emerald-500/30" style={{ top: "40%", height: "20%" }} />
          {/* Meter position indicator */}
          <div
            className="absolute w-full bg-gradient-to-b from-blue-500 via-green-500 to-red-500 transition-all"
            style={{
              top: `${100 - meterPosition}%`,
              height: "4px",
            }}
          />
        </div>

        {/* Fish emoji with animation */}
        <div className="text-6xl">
          {fishPullPattern === "smooth" && "🐟"}
          {fishPullPattern === "jerky" && "🦈"}
          {fishPullPattern === "fast" && "🐠"}
        </div>
      </div>

      {/* Catch progress */}
      <div className="mt-8 w-full max-w-md">
        <div className="text-white text-sm mb-2">Catch Progress</div>
        <div className="h-6 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{ width: `${catchProgress}%` }}
          />
        </div>
      </div>

      {/* Control button */}
      <button
        onMouseDown={handleHold}
        onMouseUp={handleRelease}
        onTouchStart={handleHold}
        onTouchEnd={handleRelease}
        className="mt-6 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl"
      >
        {isHolding ? "Holding..." : "Hold to Control"}
      </button>
    </div>
  )
}

// Pattern 3: Lane-Based Fish Catching
function LaneBasedPattern({ onCatch, onMiss, isPlaying }: PatternProps) {
  const [hookLane, setHookLane] = useState(2) // 0-4 (5 lanes)
  const [fish, setFish] = useState<
    Array<{
      id: number
      lane: number
      x: number // 0-100 (horizontal position)
      type: string
      catchWindow: number // How long catch window is
      isFakeout: boolean
      speed: number
    }>
  >([])
  const lanes = 5

  // Spawn fish
  useInterval(
    () => {
      if (!isPlaying) return

      const newFish = {
        id: Date.now(),
        lane: Math.floor(Math.random() * lanes),
        x: -10, // Start off-screen
        type: Math.random() > 0.7 ? "rare" : "common",
        catchWindow: Math.random() > 0.7 ? 200 : 400, // ms
        isFakeout: Math.random() > 0.8,
        speed: 0.5 + Math.random() * 0.5,
      }
      setFish((prev) => [...prev, newFish])
    },
    2000,
    isPlaying,
  )

  // Move fish
  useInterval(
    () => {
      if (!isPlaying) return

      setFish((prev) =>
        prev
          .map((f) => ({
            ...f,
            x: f.x + f.speed,
          }))
          .filter((f) => {
            // Remove if off-screen or fakeout completed
            if (f.x > 110) return false
            if (f.isFakeout && f.x > 50 && f.x < 60) {
              // Fakeout: turn around
              return false
            }
            return true
          }),
      )
    },
    50,
    isPlaying,
  )

  // Keyboard controls
  useEffect(() => {
    if (!isPlaying) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault()
        setHookLane((prev) => Math.max(0, prev - 1))
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault()
        setHookLane((prev) => Math.min(lanes - 1, prev + 1))
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        handleJerk()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, hookLane])

  const handleJerk = () => {
    if (!isPlaying) return

    // Check if any fish is in catch range
    const fishInRange = fish.find(
      (f) => f.lane === hookLane && f.x >= 40 && f.x <= 60 && !f.isFakeout,
    )

    if (fishInRange) {
      // Fish caught!
      const rarity: FishRarity = fishInRange.type === "rare" ? "rare" : "common"
      const caughtFish: Fish = {
        id: Date.now(),
        type: "Bass",
        rarity,
        emoji: FISH_TYPES[rarity].emoji,
        points: FISH_TYPES[rarity].points,
        pattern: "lane-based",
      }
      setFish((prev) => prev.filter((f) => f.id !== fishInRange.id))
      onCatch(caughtFish)
    } else {
      // Missed
      onMiss()
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
      <h3 className="text-white text-xl font-bold mb-4 text-center">Lane-Based Fishing!</h3>

      {/* Side view with lanes */}
      <div className="relative w-full max-w-2xl h-96 bg-gradient-to-b from-cyan-400 to-blue-900 rounded-2xl overflow-hidden">
        {/* Lane dividers */}
        {Array.from({ length: lanes - 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px bg-white/20"
            style={{ top: `${((i + 1) * 100) / lanes}%` }}
          />
        ))}

        {/* Hook */}
        <div
          className="absolute text-4xl transition-all z-20"
          style={{
            left: "10%",
            top: `${(hookLane * 100) / lanes + 50 / lanes - 2.5}%`,
          }}
        >
          🎣
        </div>

        {/* Fish */}
        {fish.map((f) => (
          <motion.div
            key={f.id}
            className="absolute text-3xl z-10"
            initial={{ x: 0 }}
            animate={{ x: `${f.x}%` }}
            style={{
              top: `${(f.lane * 100) / lanes + 50 / lanes - 1.5}%`,
            }}
          >
            {f.isFakeout && f.x > 50 && f.x < 60 ? "🔄" : FISH_TYPES[f.type === "rare" ? "rare" : "common"].emoji}
          </motion.div>
        ))}

        {/* Catch zone indicator */}
        <div
          className="absolute w-20 h-full border-2 border-emerald-400/50 bg-emerald-500/10 z-5"
          style={{ left: "40%" }}
        />
      </div>

      {/* Controls */}
      <div className="mt-4 text-white text-sm text-center">
        <div>Arrow Keys / WASD: Move hook</div>
        <div>Space / Tap: Jerk line</div>
      </div>

      <button
        onClick={handleJerk}
        className="mt-4 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl"
      >
        Jerk Line
      </button>
    </div>
  )
}

// Pattern 4: Drag-Path Hook Control
function DragPathPattern({ onCatch, onMiss, isPlaying }: PatternProps) {
  const [dragPath, setDragPath] = useState<Array<{ x: number; y: number }>>([])
  const [lurePosition, setLurePosition] = useState(0) // Position along path (0-100)
  const [isDragging, setIsDragging] = useState(false)
  const [fish, setFish] = useState<
    Array<{
      id: number
      x: number
      y: number
      behavior: "shy" | "aggressive" | "group-following"
      following: boolean
      interest: number // 0-100
    }>
  >([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize fish
  useEffect(() => {
    if (!isPlaying) return

    const newFish: Array<{
      id: number
      x: number
      y: number
      behavior: "shy" | "aggressive" | "group-following"
      following: boolean
      interest: number
    }> = []

    // Spawn 3-5 fish with different behaviors
    const behaviors: Array<"shy" | "aggressive" | "group-following"> = [
      "shy",
      "aggressive",
      "group-following",
    ]
    for (let i = 0; i < 4; i++) {
      newFish.push({
        id: Date.now() + i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        behavior: behaviors[Math.floor(Math.random() * behaviors.length)],
        following: false,
        interest: 0,
      })
    }
    setFish(newFish)
  }, [isPlaying])

  // Lure movement along path
  useInterval(
    () => {
      if (dragPath.length > 1 && isPlaying) {
        setLurePosition((prev) => {
          const newPos = prev + 0.5
          if (newPos >= 100) {
            // Path complete, reset or miss
            onMiss()
            return 0
          }
          return newPos
        })
      }
    },
    50,
    dragPath.length > 1 && isPlaying,
  )

  // Fish AI behavior
  useInterval(
    () => {
      if (!isPlaying || dragPath.length === 0) return

      // Get current lure position
      const pathIndex = Math.floor((lurePosition / 100) * (dragPath.length - 1))
      const lurePoint = dragPath[pathIndex]
      if (!lurePoint) return

      setFish((prev) =>
        prev.map((f) => {
          const distance = Math.sqrt(
            Math.pow(f.x - lurePoint.x, 2) + Math.pow(f.y - lurePoint.y, 2),
          )

          let newInterest = f.interest
          let newFollowing = f.following

          switch (f.behavior) {
            case "shy":
              // Only interested if lure is slow/stopped
              if (lurePosition < 5 || lurePosition > 95) {
                newInterest = Math.min(100, f.interest + 2)
              } else {
                newInterest = Math.max(0, f.interest - 1)
              }
              break
            case "aggressive":
              // Quickly interested when lure passes
              if (distance < 15) {
                newInterest = Math.min(100, f.interest + 5)
                newFollowing = true
              }
              break
            case "group-following":
              // Follow if other fish are following
              const othersFollowing = prev.filter(
                (other) => other.id !== f.id && other.following,
              ).length
              if (othersFollowing > 0 && distance < 20) {
                newInterest = Math.min(100, f.interest + 3)
                newFollowing = true
              }
              break
          }

          // Move toward lure if following
          if (newFollowing && distance > 5) {
            const dx = (lurePoint.x - f.x) * 0.1
            const dy = (lurePoint.y - f.y) * 0.1
            return {
              ...f,
              x: f.x + dx,
              y: f.y + dy,
              interest: newInterest,
              following: newFollowing,
            }
          }

          // Check for bite
          if (newInterest >= 80 && distance < 8) {
            const rarity: FishRarity = "uncommon"
            const caughtFish: Fish = {
              id: Date.now(),
              type: "Salmon",
              rarity,
              emoji: FISH_TYPES[rarity].emoji,
              points: FISH_TYPES[rarity].points,
              pattern: "drag-path",
            }
            onCatch(caughtFish)
          }

          return {
            ...f,
            interest: newInterest,
            following: newFollowing,
          }
        }),
      )
    },
    100,
    isPlaying,
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setDragPath([{ x, y }])
    setLurePosition(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setDragPath((prev) => [...prev, { x, y }])
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Get lure position on path
  const getLurePoint = () => {
    if (dragPath.length === 0) return null
    const pathIndex = Math.floor((lurePosition / 100) * (dragPath.length - 1))
    return dragPath[pathIndex]
  }

  const lurePoint = getLurePoint()

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <h3 className="text-white text-xl font-bold mb-4 text-center">Drag-Path Fishing!</h3>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full max-w-2xl h-96 bg-gradient-to-br from-cyan-300 to-blue-800 rounded-2xl overflow-hidden cursor-crosshair"
      >
        {/* Drawn path */}
        {dragPath.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d={`M ${dragPath.map((p) => `${p.x}%,${p.y}%`).join(" L ")}`}
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
            />
          </svg>
        )}

        {/* Lure */}
        {lurePoint && (
          <div
            className="absolute text-3xl transition-all z-20"
            style={{
              left: `${lurePoint.x}%`,
              top: `${lurePoint.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            🪝
          </div>
        )}

        {/* Fish */}
        {fish.map((f) => (
          <div
            key={f.id}
            className="absolute text-2xl transition-all z-10"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              transform: "translate(-50%, -50%)",
              opacity: f.following ? 1 : 0.6,
            }}
          >
            {f.behavior === "shy" && "🐟"}
            {f.behavior === "aggressive" && "🦈"}
            {f.behavior === "group-following" && "🐠"}
          </div>
        ))}
      </div>

      <div className="mt-4 text-white text-sm text-center">
        <div>Drag to create a path for your lure</div>
        <div>Fish will react based on their behavior</div>
      </div>
    </div>
  )
}

// Pattern 5: Quick-Time Events (QTE) Reeling
function QTEReelingPattern({ onCatch, onMiss, isPlaying }: PatternProps) {
  const [currentPrompt, setCurrentPrompt] = useState<
    "tap" | "swipe-up" | "swipe-down" | "hold" | null
  >(null)
  const [reelProgress, setReelProgress] = useState(0)
  const [lineBreakChance, setLineBreakChance] = useState(0)
  const [promptTimer, setPromptTimer] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [holdStartTime, setHoldStartTime] = useState(0)
  const [requiredHoldTime, setRequiredHoldTime] = useState(0)
  const touchStartRef = useRef<{ y: number; time: number } | null>(null)

  const promptTypes: Array<"tap" | "swipe-up" | "swipe-down" | "hold"> = [
    "tap",
    "swipe-up",
    "swipe-down",
    "hold",
  ]

  // Generate new prompt
  const generatePrompt = useCallback(() => {
    const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
    setCurrentPrompt(promptType)
    setPromptTimer(2000) // 2 seconds to complete

    if (promptType === "hold") {
      setRequiredHoldTime(500 + Math.random() * 500) // 0.5-1 second hold
      setIsHolding(false)
      setHoldStartTime(0)
    }
  }, [])

  // Start prompt sequence
  useEffect(() => {
    if (isPlaying) {
      generatePrompt()
    }
  }, [isPlaying, generatePrompt])

  // Prompt timer countdown
  useInterval(
    () => {
      if (currentPrompt && isPlaying) {
        setPromptTimer((prev) => {
          if (prev <= 0) {
            // Timeout - increase line break chance
            setLineBreakChance((prev) => Math.min(100, prev + 15))
            generatePrompt()
            return 2000
          }
          return prev - 50
        })
      }
    },
    50,
    currentPrompt !== null && isPlaying,
  )

  // Hold timer
  useInterval(
    () => {
      if (currentPrompt === "hold" && isHolding && isPlaying) {
        const holdDuration = Date.now() - holdStartTime
        if (holdDuration >= requiredHoldTime) {
          // Hold completed
          handlePromptSuccess()
        }
      }
    },
    50,
    currentPrompt === "hold" && isHolding && isPlaying,
  )

  // Line break check
  useEffect(() => {
    if (lineBreakChance >= 100) {
      onMiss()
    }
  }, [lineBreakChance, onMiss])

  const handlePromptSuccess = () => {
    setReelProgress((prev) => {
      const newProgress = prev + 10
      if (newProgress >= 100) {
        // Fish caught!
        const rarity: FishRarity = "rare"
        const fish: Fish = {
          id: Date.now(),
          type: "Tuna",
          rarity,
          emoji: FISH_TYPES[rarity].emoji,
          points: FISH_TYPES[rarity].points,
          pattern: "qte-reeling",
        }
        onCatch(fish)
      }
      return newProgress
    })
    setLineBreakChance((prev) => Math.max(0, prev - 5))
    generatePrompt()
  }

  const handleTap = () => {
    if (currentPrompt === "tap" && isPlaying) {
      handlePromptSuccess()
    } else if (currentPrompt !== null) {
      // Wrong input
      setLineBreakChance((prev) => Math.min(100, prev + 10))
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { y: touch.clientY, time: Date.now() }

    if (currentPrompt === "hold") {
      setIsHolding(true)
      setHoldStartTime(Date.now())
    } else {
      handleTap()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaY = touch.clientY - touchStartRef.current.y
    const absDeltaY = Math.abs(deltaY)

    if (currentPrompt === "swipe-up" && deltaY < -30 && absDeltaY > 50) {
      handlePromptSuccess()
    } else if (currentPrompt === "swipe-down" && deltaY > 30 && absDeltaY > 50) {
      handlePromptSuccess()
    } else if (currentPrompt === "hold") {
      setIsHolding(false)
    } else if (currentPrompt !== null) {
      setLineBreakChance((prev) => Math.min(100, prev + 10))
    }

    touchStartRef.current = null
  }

  const getPromptIcon = () => {
    switch (currentPrompt) {
      case "tap":
        return "👆"
      case "swipe-up":
        return "⬆️"
      case "swipe-down":
        return "⬇️"
      case "hold":
        return isHolding ? "⏸️" : "👊"
      default:
        return "🎣"
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <h3 className="text-white text-xl font-bold mb-4 text-center">QTE Reeling!</h3>

      {/* Prompt display */}
      <div
        className="w-64 h-64 bg-zinc-800 rounded-full flex items-center justify-center mb-8 border-4 border-cyan-500"
        onMouseDown={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="text-8xl">{getPromptIcon()}</div>
      </div>

      {/* Timer indicator */}
      <div className="mb-4 w-full max-w-md">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{ width: `${(promptTimer / 2000) * 100}%` }}
          />
        </div>
      </div>

      {/* Reel progress */}
      <div className="mb-4 w-full max-w-md">
        <div className="text-white text-sm mb-2">Reel Progress</div>
        <div className="h-6 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${reelProgress}%` }}
          />
        </div>
      </div>

      {/* Line break chance */}
      <div className="mb-4 w-full max-w-md">
        <div className="text-white text-sm mb-2">Line Break Risk</div>
        <div className="h-6 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${lineBreakChance}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-white text-sm text-center mt-4">
        <div>Follow the prompts quickly!</div>
        {currentPrompt === "hold" && (
          <div className="text-cyan-400">Hold until the bar fills</div>
        )}
      </div>
    </div>
  )
}
