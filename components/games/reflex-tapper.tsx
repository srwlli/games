"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { GameOverModal, StartScreen, CountdownOverlay, UnifiedHUD } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useInterval } from "@/hooks/use-interval"
import { useCountdown } from "@/hooks/use-countdown"
import type { Target, RulePhase, GameMode, ReactionTime, StreakState, PowerUpType } from "@/lib/reflex-tapper/types"
import { GAME_MODES, TARGET_COLORS, POWER_UPS } from "@/lib/reflex-tapper/config"
import {
  calculateSpawnInterval,
  calculateTargetLifetime,
  getCurrentRulePhase,
  shouldTapTarget,
  generateTarget,
  calculateScore,
  updateStreak,
  calculateAdaptiveDifficulty,
  shouldSpawnBurst,
  shouldSpawnGap,
  getPatternClass,
} from "@/lib/reflex-tapper/utils"
import {
  Target as TargetIcon,
  Ban,
  Zap,
  Sparkles,
} from "lucide-react"
import { soundManager } from "@/lib/reflex-tapper/sounds"
import { loadStats, updateStats, saveStats } from "@/lib/reflex-tapper/persistence"

export default function ReflexTapper() {
  // Game mode selection
  const [gameMode, setGameMode] = useState<GameMode>("classic")
  const config = GAME_MODES[gameMode]

  // Pre-round countdown state
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const countdownStartedRef = useRef(false)

  // Game state
  const { isPlaying, isPaused, isGameOver, pause, resume, gameOver, reset, start } = useGameState({
    initialState: "idle",
  })

  // Game data
  const [targets, setTargets] = useState<Target[]>([])
  const targetsRef = useRef<Target[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState<StreakState>({ current: 0, multiplier: 1.0, maxStreak: 0 })
  const [reactionTimes, setReactionTimes] = useState<ReactionTime[]>([])
  const [currentPhase, setCurrentPhase] = useState<RulePhase | null>(null)
  const [showNewRuleBanner, setShowNewRuleBanner] = useState(false)
  const [powerUpActive, setPowerUpActive] = useState<{ type: PowerUpType; multiplier: number; endTime: number } | null>(null)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [floatingScores, setFloatingScores] = useState<{ id: number; x: number; y: number; value: number; color: string }[]>([])
  const [isShaking, setIsShaking] = useState(false)

  // Timing and difficulty
  const gameStartTimeRef = useRef<number>(0)
  const lastSpawnTimeRef = useRef<number>(0)
  const elapsedSecondsRef = useRef<number>(0)
  const targetLifetimeRef = useRef<number>(config.initialTargetLifetime)
  const recentAccuracyRef = useRef<number[]>([]) // Track recent hit/miss for adaptive difficulty
  const gapEndTimeRef = useRef<number>(0)

  // Accessibility
  const reducedMotion = useReducedMotion()
  const ariaLiveRef = useRef<HTMLDivElement>(null)

  // Countdown timer
  const { timeLeft, reset: resetTimer } = useCountdown(
    config.initialTime,
    () => {
      endGame()
    },
    isPlaying && countdown === null,
  )

  // Spawn targets logic
  const spawnTarget = useCallback(() => {
    if (targetsRef.current.length >= config.maxTargetsOnScreen) return
    if (Date.now() < gapEndTimeRef.current) return // Gap period

    const elapsed = elapsedSecondsRef.current
    const phase = getCurrentRulePhase(elapsed)

    // Check for burst spawn
    if (shouldSpawnBurst()) {
      const burstSize = 3
      const newTargets: Target[] = []
      for (let i = 0; i < burstSize && targetsRef.current.length + newTargets.length < config.maxTargetsOnScreen; i++) {
        const target = generateTarget(config, phase, [...targetsRef.current, ...newTargets], elapsed)
        newTargets.push(target)
      }
      setTargets((prev) => {
        const updated = [...prev, ...newTargets]
        targetsRef.current = updated
        return updated
      })
      return
    }

    // Check for gap
    if (shouldSpawnGap()) {
      gapEndTimeRef.current = Date.now() + 2000
      return
    }

    // Normal spawn
    const newTarget = generateTarget(config, phase, targetsRef.current, elapsed)
    setTargets((prev) => {
      if (prev.length >= config.maxTargetsOnScreen) return prev
      const updated = [...prev, newTarget]
      targetsRef.current = updated
      return updated
    })

    // Auto-remove after lifetime
    setTimeout(() => {
      setTargets((prev) => {
        const filtered = prev.filter((t) => t.id !== newTarget.id)
        if (filtered.length < prev.length && newTarget.type !== "decoy") {
          recentAccuracyRef.current.push(0)
          if (recentAccuracyRef.current.length > 10) recentAccuracyRef.current.shift()
        }
        targetsRef.current = filtered
        return filtered
      })
    }, newTarget.lifetime)
  }, [config])

  // Game Logic Loop (Fixed 100ms tick)
  useInterval(() => {
    if (!isPlaying || countdown !== null || isPaused) return

    const now = Date.now()
    elapsedSecondsRef.current = (now - gameStartTimeRef.current) / 1000

    const newPhase = getCurrentRulePhase(elapsedSecondsRef.current)
    if (newPhase && (!currentPhase || newPhase.id !== currentPhase.id)) {
      setCurrentPhase(newPhase)
      setShowNewRuleBanner(true)
      soundManager.phaseChange()
      setTimeout(() => setShowNewRuleBanner(false), 2000)
    }

    const baseInterval = calculateSpawnInterval(elapsedSecondsRef.current, config)
    targetLifetimeRef.current = calculateTargetLifetime(elapsedSecondsRef.current, config)

    let finalInterval = baseInterval
    if (config.adaptiveDifficulty && recentAccuracyRef.current.length >= 5) {
      const avgAccuracy = recentAccuracyRef.current.reduce((a, b) => a + b, 0) / recentAccuracyRef.current.length
      const adaptive = calculateAdaptiveDifficulty(avgAccuracy, baseInterval, targetLifetimeRef.current)
      finalInterval = adaptive.spawnIntervalMultiplier * baseInterval
      targetLifetimeRef.current = adaptive.targetLifetimeMultiplier * targetLifetimeRef.current
    }

    if (now - lastSpawnTimeRef.current >= finalInterval) {
      spawnTarget()
      lastSpawnTimeRef.current = now
    }
  }, 100, isPlaying && countdown === null)

  // Handle target click
  const handleTargetClick = useCallback(
    (target: Target, e?: React.MouseEvent | React.TouchEvent) => {
      if (e) e.stopPropagation()

      const reactionTime = Date.now() - target.spawnTime
      const shouldTap = shouldTapTarget(target, currentPhase)

      setTargets((prev) => {
        const updated = prev.filter((t) => t.id !== target.id)
        targetsRef.current = updated
        return updated
      })

      if (target.type === "powerup" && target.powerUpType) {
        soundManager.powerUp()
        const powerUpKey = target.powerUpType === "extra-time" ? "extraTime" : target.powerUpType === "slow-motion" ? "slowMotion" : "doubleScore"
        const powerUpConfig = POWER_UPS[powerUpKey as keyof typeof POWER_UPS]
        
        const scoreId = Date.now() + Math.random()
        setFloatingScores((prev) => [...prev, { id: scoreId, x: target.x, y: target.y, value: 50, color: "text-purple-400" }])
        setTimeout(() => setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId)), 1000)

        if (target.powerUpType === "extra-time") {
          resetTimer(timeLeft + (powerUpConfig as { duration: number; timeAdded: number }).timeAdded)
        } else if (target.powerUpType === "double-score") {
          setPowerUpActive({
            type: target.powerUpType,
            multiplier: (powerUpConfig as { duration: number; multiplier: number }).multiplier,
            endTime: Date.now() + powerUpConfig.duration,
          })
        }
        setScore((prev) => prev + 50)
        return
      }

      if (!shouldTap || target.type === "decoy") {
        soundManager.decoy()
        setScore((prev) => Math.max(0, prev - 20))
        setStreak((prev) => updateStreak(false, prev))
        recentAccuracyRef.current.push(0)
        if (recentAccuracyRef.current.length > 10) recentAccuracyRef.current.shift()

        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 300)

        const scoreId = Date.now() + Math.random()
        setFloatingScores((prev) => [...prev, { id: scoreId, x: target.x, y: target.y, value: -20, color: "text-red-500" }])
        setTimeout(() => setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId)), 1000)
        return
      }

      soundManager.hit()
      const points = calculateScore(target, streak, powerUpActive)
      setScore((prev) => prev + points)
      setStreak((prev) => updateStreak(true, prev))
      setReactionTimes((prev) => [...prev, { targetId: target.id, reactionMs: reactionTime, timestamp: Date.now() }])
      recentAccuracyRef.current.push(1)
      if (recentAccuracyRef.current.length > 10) recentAccuracyRef.current.shift()

      const scoreId = Date.now() + Math.random()
      setFloatingScores((prev) => [...prev, { id: scoreId, x: target.x, y: target.y, value: points, color: "text-emerald-400" }])
      setTimeout(() => setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId)), 1000)

      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = `Score: ${score + points}, Streak: ${streak.current + 1}`
      }
    },
    [currentPhase, score, streak, powerUpActive, timeLeft, resetTimer],
  )

  // Handle background click (miss)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (!isPlaying || isPaused || countdown !== null) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    soundManager.decoy()
    setScore((prev) => Math.max(0, prev - 5))
    setStreak((prev) => updateStreak(false, prev))
    
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 200)

    const scoreId = Date.now() + Math.random()
    setFloatingScores((prev) => [...prev, { id: scoreId, x, y, value: -5, color: "text-red-400 opacity-70" }])
    setTimeout(() => setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId)), 1000)
  }, [isPlaying, isPaused, countdown])

  // Check power-up expiration
  useEffect(() => {
    if (!powerUpActive) return
    const check = setInterval(() => {
      if (Date.now() >= powerUpActive.endTime) {
        setPowerUpActive(null)
      }
    }, 100)
    return () => clearInterval(check)
  }, [powerUpActive])

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null)
        setShowCountdown(false)
        setTimeout(() => {
          gameStartTimeRef.current = Date.now()
          lastSpawnTimeRef.current = Date.now()
          elapsedSecondsRef.current = 0
          const initialPhase = getCurrentRulePhase(0)
          setCurrentPhase(initialPhase)
          spawnTarget()
        }, 0)
      } else {
        setCountdown(countdown - 1)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown, spawnTarget])

  // Reset game
  const resetGame = useCallback(() => {
    setTargets([])
    targetsRef.current = []
    setScore(0)
    setStreak({ current: 0, multiplier: 1.0, maxStreak: 0 })
    setReactionTimes([])
    setCurrentPhase(null)
    setShowNewRuleBanner(false)
    setPowerUpActive(null)
    setCountdown(null)
    setShowCountdown(false)
    countdownStartedRef.current = false
    recentAccuracyRef.current = []
    targetLifetimeRef.current = config.initialTargetLifetime
    lastSpawnTimeRef.current = 0
    gapEndTimeRef.current = 0
    resetTimer(config.initialTime)
    reset()
  }, [config, resetTimer, reset])

  // Start game
  const startGame = useCallback(() => {
    resetGame()
    start()
    setCountdown(3)
    setShowCountdown(true)
  }, [resetGame, start])

  // End game
  const endGame = useCallback(() => {
    gameOver()
    const avgReaction = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b.reactionMs, 0) / reactionTimes.length : 0
    const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes.map((r) => r.reactionMs)) : 0
    const totalHits = reactionTimes.length
    const totalMisses = recentAccuracyRef.current.filter((a) => a === 0).length
    const hitRate = totalHits / (totalHits + totalMisses) || 0

    const updatedStats = updateStats(score, avgReaction, bestReaction, hitRate, totalHits, totalMisses)
    saveStats(updatedStats)
  }, [gameOver, reactionTimes, score])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (isPlaying && countdown === null) {
          pause()
        } else if (isPaused) {
          resume()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, isPaused, countdown, pause, resume])

  const savedStats = useMemo(() => loadStats(), [])
  const progress = useMemo(() => {
    if (config.initialTime === 0) return 0
    return ((config.initialTime - timeLeft) / config.initialTime) * 100
  }, [timeLeft, config.initialTime])

  const motionVariants = useMemo(
    () => ({
      initial: reducedMotion ? { opacity: 0 } : { scale: 0 },
      animate: reducedMotion ? { opacity: 1 } : { scale: 1 },
      exit: reducedMotion ? { opacity: 0 } : { scale: 0 },
    }),
    [reducedMotion],
  )

  return (
    <motion.div 
      className="w-full h-full bg-[#080808] flex flex-col items-center justify-between relative overflow-hidden p-4 sm:p-6"
      animate={isShaking ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.15 }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <motion.div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent" animate={timeLeft < 5 ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 0.3 }} transition={{ duration: 0.5, repeat: Infinity }} />
      </div>

      <div ref={ariaLiveRef} className="sr-only" aria-live="polite" aria-atomic="true" />

      {/* Unified HUD */}
      {isPlaying && countdown === null && (
        <UnifiedHUD
          stats={[
            { label: "Score", value: score, color: "white" },
            { label: "Streak", value: streak.current, color: "emerald" },
            { label: "Time", value: `${timeLeft}s`, color: timeLeft < 5 ? "red" : "white" },
          ]}
          className="w-full max-w-md z-20"
        />
      )}

      {/* Game Viewport Container */}
      <div className="flex-grow w-full relative min-h-0">
        <div className="absolute inset-0 cursor-crosshair z-0" onClick={handleBackgroundClick}>
          <AnimatePresence>
            {targets.map((target) => {
              const colorConfig = target.color ? TARGET_COLORS[target.color] : TARGET_COLORS.orange
              const isDecoy = target.type === "decoy"
              const isPowerUp = target.type === "powerup"
              return (
                <motion.button
                  key={target.id}
                  {...motionVariants}
                  whileTap={{ scale: 0.9, rotate: -4 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => handleTargetClick(target, e)}
                  className={`absolute w-14 h-14 sm:w-16 sm:h-16 ${getPatternClass(target.pattern || "circle")} bg-gradient-to-br ${colorConfig.bg} shadow-2xl flex items-center justify-center cursor-pointer border-2 overflow-hidden z-10 ${isDecoy ? "border-red-500/50" : isPowerUp ? "border-purple-300/50" : "border-white/20"}`}
                  style={{ left: `${target.x}%`, top: `${target.y}%`, boxShadow: isPowerUp ? "0 0 40px rgba(168, 85, 247, 0.4)" : `0 20px 40px -10px rgba(0, 0, 0, 0.5)` }}
                  animate={{ ...motionVariants.animate, scale: isPowerUp ? [1, 1.1, 1] : 1 }}
                  transition={{ scale: isPowerUp ? { duration: 1, repeat: Infinity } : {} }}
                >
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-40">
                    <motion.circle cx="50%" cy="50%" r="40%" fill="none" stroke="white" strokeWidth="4" strokeDasharray="250%" initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: "250%" }} transition={{ duration: target.lifetime / 1000, ease: "linear" }} />
                  </svg>
                  <div className="relative z-10 flex items-center justify-center w-full h-full">
                    {isPowerUp ? <Zap size={24} className="text-white fill-white" /> : isDecoy ? <Ban size={24} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-white opacity-40" />}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-30" />
                </motion.button>
              )
            })}
            {floatingScores.map((fs) => (
              <motion.div key={fs.id} initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 1, 0], y: -50, scale: [0.5, 1.2, 1, 0.8] }} transition={{ duration: 0.8, ease: "easeOut" }} className={`absolute pointer-events-none font-black text-2xl z-30 ${fs.color}`} style={{ left: `${fs.x}%`, top: `${fs.y}%`, transform: 'translate(-50%, -50%)' }}>
                {fs.value > 0 ? `+${fs.value}` : fs.value}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Start Screen */}
      {!isPlaying && !isGameOver && (
        <StartScreen title="Reflex Tapper" description="Tap targets as fast as you can!" onStart={startGame} accentColor="orange" controls={["Click targets to score", "P or Escape to pause"]}>
          <div className="mb-6">
            <label className="block text-zinc-500 font-bold mb-3 text-[10px] uppercase tracking-[0.2em] text-center">Choose Game Mode</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(GAME_MODES) as GameMode[]).map((mode) => (
                <button key={mode} onClick={() => setGameMode(mode)} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 flex items-center justify-between ${gameMode === mode ? "bg-orange-500/10 border-orange-500 text-orange-400" : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`}>
                  <span className="capitalize">{mode.replace("-", " ")}</span>
                  <span className="text-[10px] opacity-60">{mode === "classic" ? "20s" : mode === "sudden-death" ? "60s • 1 Life" : "5s • FAST"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowStats(true)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Stats</button>
            <button onClick={() => setShowHowToPlay(true)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Help</button>
          </div>
        </StartScreen>
      )}

      {/* Overlays */}
      <CountdownOverlay count={showCountdown ? countdown : null} accentColor="orange" />
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20">
          <div className="bg-zinc-900 border-2 border-orange-500 rounded-3xl p-10 text-center max-w-md">
            <h2 className="text-4xl font-black text-orange-400 mb-4">Paused</h2>
            <button onClick={resume} className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors w-full mb-2">Resume</button>
            <button onClick={resetGame} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full">Restart</button>
          </div>
        </div>
      )}
      <GameOverModal isOpen={isGameOver} title="Time Up!" score={score} scoreLabel="Final Score" accentColor="orange" onPlayAgain={resetGame} additionalContent={<div className="mt-6 space-y-2 text-center">{reactionTimes.length > 0 && <><p className="text-zinc-400">Avg Reaction: {(reactionTimes.reduce((a, b) => a + b.reactionMs, 0) / reactionTimes.length).toFixed(0)}ms</p></>}</div>} />
    </motion.div>
  )
}
