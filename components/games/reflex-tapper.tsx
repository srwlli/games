"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"
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
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState<StreakState>({ current: 0, multiplier: 1.0, maxStreak: 0 })
  const [reactionTimes, setReactionTimes] = useState<ReactionTime[]>([])
  const [currentPhase, setCurrentPhase] = useState<RulePhase | null>(null)
  const [showNewRuleBanner, setShowNewRuleBanner] = useState(false)
  const [powerUpActive, setPowerUpActive] = useState<{ type: PowerUpType; multiplier: number; endTime: number } | null>(null)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Timing and difficulty
  const gameStartTimeRef = useRef<number>(0)
  const elapsedSecondsRef = useRef<number>(0)
  const spawnIntervalRef = useRef<number>(config.initialSpawnInterval)
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

  // Update elapsed time
  useEffect(() => {
    if (!isPlaying || countdown !== null) return

    const interval = setInterval(() => {
      elapsedSecondsRef.current = (Date.now() - gameStartTimeRef.current) / 1000

      // Update rule phase
      const newPhase = getCurrentRulePhase(elapsedSecondsRef.current)
      if (newPhase && (!currentPhase || newPhase.id !== currentPhase.id)) {
        setCurrentPhase(newPhase)
        setShowNewRuleBanner(true)
        soundManager.phaseChange()
        setTimeout(() => setShowNewRuleBanner(false), 2000)
      }

      // Update difficulty ramp
      spawnIntervalRef.current = calculateSpawnInterval(elapsedSecondsRef.current, config)
      targetLifetimeRef.current = calculateTargetLifetime(elapsedSecondsRef.current, config)

      // Update adaptive difficulty
      if (config.adaptiveDifficulty && recentAccuracyRef.current.length >= 5) {
        const avgAccuracy = recentAccuracyRef.current.reduce((a, b) => a + b, 0) / recentAccuracyRef.current.length
        const adaptive = calculateAdaptiveDifficulty(avgAccuracy, spawnIntervalRef.current, targetLifetimeRef.current)
        spawnIntervalRef.current = adaptive.spawnIntervalMultiplier * spawnIntervalRef.current
        targetLifetimeRef.current = adaptive.targetLifetimeMultiplier * targetLifetimeRef.current
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, countdown, currentPhase, config])

  // Spawn targets
  const spawnTarget = useCallback(() => {
    if (targets.length >= config.maxTargetsOnScreen) return
    if (Date.now() < gapEndTimeRef.current) return // Gap period

    const elapsed = elapsedSecondsRef.current
    const phase = getCurrentRulePhase(elapsed)

    // Check for burst spawn
    if (shouldSpawnBurst()) {
      const burstSize = 3
      const newTargets: Target[] = []
      for (let i = 0; i < burstSize && targets.length + newTargets.length < config.maxTargetsOnScreen; i++) {
        const target = generateTarget(config, phase, [...targets, ...newTargets], elapsed)
        newTargets.push(target)
      }
      setTargets((prev) => [...prev, ...newTargets])
      return
    }

    // Check for gap
    if (shouldSpawnGap()) {
      gapEndTimeRef.current = Date.now() + 2000
      return
    }

    // Normal spawn
    const newTarget = generateTarget(config, phase, targets, elapsed)
    setTargets((prev) => {
      if (prev.length >= config.maxTargetsOnScreen) return prev
      return [...prev, newTarget]
    })

    // Auto-remove after lifetime
    setTimeout(() => {
      setTargets((prev) => {
        const filtered = prev.filter((t) => t.id !== newTarget.id)
        if (filtered.length < prev.length && newTarget.type !== "decoy") {
          // Target despawned without being hit - count as miss
          recentAccuracyRef.current.push(0)
          if (recentAccuracyRef.current.length > 10) recentAccuracyRef.current.shift()
        }
        return filtered
      })
    }, newTarget.lifetime)
  }, [targets, config])

  // Dynamic spawn interval
  useInterval(spawnTarget, spawnIntervalRef.current, isPlaying && countdown === null)

  // Handle target click
  const handleTargetClick = useCallback(
    (target: Target) => {
      const reactionTime = Date.now() - target.spawnTime
      const shouldTap = shouldTapTarget(target, currentPhase)

      setTargets((prev) => prev.filter((t) => t.id !== target.id))

      if (target.type === "powerup" && target.powerUpType) {
        // Activate power-up
        soundManager.powerUp()
        const powerUpKey = target.powerUpType === "extra-time" ? "extraTime" : target.powerUpType === "slow-motion" ? "slowMotion" : "doubleScore"
        const powerUpConfig = POWER_UPS[powerUpKey as keyof typeof POWER_UPS]
        if (target.powerUpType === "extra-time") {
          resetTimer(timeLeft + (powerUpConfig as { duration: number; timeAdded: number }).timeAdded)
        } else if (target.powerUpType === "slow-motion") {
          // Slow motion handled via spawn interval adjustment
          spawnIntervalRef.current *= 2
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
        // Wrong target or decoy
        soundManager.decoy()
        setScore((prev) => Math.max(0, prev - 20))
        setStreak((prev) => updateStreak(false, prev))
        recentAccuracyRef.current.push(0)
        if (recentAccuracyRef.current.length > 10) recentAccuracyRef.current.shift()
        return
      }

      // Correct hit
      soundManager.hit()
      const points = calculateScore(target, streak, powerUpActive)
      setScore((prev) => prev + points)
      setStreak((prev) => updateStreak(true, prev))
      setReactionTimes((prev) => [...prev, { targetId: target.id, reactionMs: reactionTime, timestamp: Date.now() }])
      recentAccuracyRef.current.push(1)
      if (recentAccuracyRef.current.length > 10) recentAccuracyRef.current.shift()

      // Update aria-live
      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = `Score: ${score + points}, Streak: ${streak.current + 1}`
      }
    },
    [currentPhase, score, streak, powerUpActive, timeLeft, resetTimer],
  )

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

  // Pre-round countdown - only start once when game begins
  useEffect(() => {
    if (isPlaying && countdown === null && !showCountdown && !countdownStartedRef.current) {
      countdownStartedRef.current = true
      setShowCountdown(true)
      setCountdown(3)
    }
  }, [isPlaying, countdown, showCountdown])

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    const timer = setTimeout(() => {
      if (countdown === 1) {
        // Countdown finished - start the game
        setCountdown(null)
        setShowCountdown(false)
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          gameStartTimeRef.current = Date.now()
          elapsedSecondsRef.current = 0
          const initialPhase = getCurrentRulePhase(0)
          setCurrentPhase(initialPhase)
        }, 0)
      } else {
        setCountdown(countdown - 1)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  // Reset game
  const resetGame = useCallback(() => {
    setTargets([])
    setScore(0)
    setStreak({ current: 0, multiplier: 1.0, maxStreak: 0 })
    setReactionTimes([])
    setCurrentPhase(null)
    setShowNewRuleBanner(false)
    setPowerUpActive(null)
    setCountdown(null)
    setShowCountdown(false)
    countdownStartedRef.current = false // Reset countdown flag
    recentAccuracyRef.current = []
    spawnIntervalRef.current = config.initialSpawnInterval
    targetLifetimeRef.current = config.initialTargetLifetime
    gapEndTimeRef.current = 0
    resetTimer(config.initialTime)
    reset()
  }, [config, resetTimer, reset])

  // Start game
  const startGame = useCallback(() => {
    resetGame()
    start()
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
      // Keyboard activation for targets (Enter/Space)
      if ((e.key === "Enter" || e.key === " ") && isPlaying && countdown === null) {
        // Focused target would be activated - handled by target button focus
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, isPaused, countdown, pause, resume])

  // Load stats on mount
  const savedStats = useMemo(() => loadStats(), [])

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (config.initialTime === 0) return 0
    return ((config.initialTime - timeLeft) / config.initialTime) * 100
  }, [timeLeft, config.initialTime])

  // Animation variants for reduced motion
  const motionVariants = useMemo(
    () => ({
      initial: reducedMotion ? { opacity: 0 } : { scale: 0 },
      animate: reducedMotion ? { opacity: 1 } : { scale: 1 },
      exit: reducedMotion ? { opacity: 0 } : { scale: 0 },
    }),
    [reducedMotion],
  )

  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-950 to-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* ARIA Live Region */}
      <div ref={ariaLiveRef} className="sr-only" aria-live="polite" aria-atomic="true" />

      {/* Pre-round countdown */}
      {showCountdown && countdown !== null && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center z-30 bg-black/80"
        >
          <motion.div
            key={countdown}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-9xl font-black text-orange-400"
          >
            {countdown === 0 ? "GO!" : countdown}
          </motion.div>
        </motion.div>
      )}

      {/* Mode Selection (before game starts) */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <div className="bg-zinc-900 border-2 border-orange-500 rounded-3xl p-10 text-center max-w-md">
            <h2 className="text-4xl font-black text-orange-400 mb-6">Reflex Tapper</h2>
            <div className="mb-6">
              <label className="block text-white mb-2">Select Mode:</label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value as GameMode)}
                className="w-full bg-zinc-800 text-white p-3 rounded-lg border border-zinc-700"
              >
                <option value="classic">Classic (20s)</option>
                <option value="sudden-death">Sudden Death (60s, 1 mistake = game over)</option>
                <option value="burst">Burst (5s, fast-paced)</option>
              </select>
            </div>
            <button
              onClick={startGame}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors w-full"
            >
              Start Game
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full"
            >
              View Stats
            </button>
            <button
              onClick={() => setShowHowToPlay(true)}
              className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full"
            >
              How to Play
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {isPlaying && countdown === null && (
        <StatsBar
          stats={[
            { label: "Score", value: score, color: "orange" },
            {
              label: "Time",
              value: `${timeLeft}s`,
              color: timeLeft < 10 ? "red" : "white",
            },
            {
              label: "Streak",
              value: `${streak.current}x${streak.multiplier.toFixed(1)}`,
              color: streak.current > 5 ? "emerald" : "white",
            },
          ]}
          layout="absolute"
          position="top"
        />
      )}

      {/* Progress Indicator */}
      {isPlaying && countdown === null && (
        <div className="absolute top-20 left-0 right-0 px-8 z-10">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Current Rule Display */}
      {isPlaying && countdown === null && currentPhase && (
        <div className="absolute top-32 left-0 right-0 z-10 flex justify-center">
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-orange-500 rounded-xl px-6 py-3">
            <p className="text-orange-400 font-bold text-lg">{currentPhase.instruction}</p>
          </div>
        </div>
      )}

      {/* New Rule Banner */}
      {showNewRuleBanner && currentPhase && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="absolute top-1/2 left-0 right-0 z-20 flex justify-center"
        >
          <div className="bg-orange-500 text-white font-black text-3xl px-12 py-6 rounded-2xl shadow-2xl">
            NEW RULE: {currentPhase.instruction}
          </div>
        </motion.div>
      )}

      {/* Target Area */}
      <div className="relative w-full h-full" role="application" aria-label="Game target area">
        <AnimatePresence>
          {targets.map((target) => {
            const colorConfig = target.color ? TARGET_COLORS[target.color] : TARGET_COLORS.orange
            const isDecoy = target.type === "decoy"
            const isPowerUp = target.type === "powerup"

            return (
              <motion.button
                key={target.id}
                {...motionVariants}
                whileTap={{ scale: 0.8 }}
                onClick={() => handleTargetClick(target)}
                className={`absolute w-16 h-16 ${getPatternClass(target.pattern || "circle")} bg-gradient-to-br ${colorConfig.bg} shadow-lg flex items-center justify-center text-2xl cursor-pointer border-2 ${
                  isDecoy ? "border-red-600 border-dashed" : isPowerUp ? "border-purple-400 border-solid" : "border-transparent"
                }`}
                style={{ left: `${target.x}%`, top: `${target.y}%` }}
                aria-label={`${target.type} target at position ${Math.round(target.x)}%, ${Math.round(target.y)}%. ${target.color ? `Color: ${target.color}.` : ""} Click to ${isDecoy ? "avoid" : "score points"}.`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleTargetClick(target)
                  }
                }}
              >
                {isPowerUp ? "⚡" : isDecoy ? "❌" : "🎯"}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20">
          <div className="bg-zinc-900 border-2 border-orange-500 rounded-3xl p-10 text-center max-w-md">
            <h2 className="text-4xl font-black text-orange-400 mb-4">Paused</h2>
            {currentPhase && <p className="text-white mb-6">Current Rule: {currentPhase.instruction}</p>}
            <p className="text-zinc-400 mb-6">Press P or Escape to resume</p>
            <button
              onClick={resume}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors w-full mb-2"
            >
              Resume
            </button>
            <button
              onClick={resetGame}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        title="Time Up!"
        score={score}
        scoreLabel="Final Score"
        accentColor="orange"
        onPlayAgain={startGame}
        additionalContent={
          <div className="mt-6 space-y-2">
            {reactionTimes.length > 0 && (
              <>
                <p className="text-zinc-400">
                  Average Reaction: {(reactionTimes.reduce((a, b) => a + b.reactionMs, 0) / reactionTimes.length).toFixed(0)}ms
                </p>
                <p className="text-zinc-400">
                  Best Reaction: {Math.min(...reactionTimes.map((r) => r.reactionMs)).toFixed(0)}ms
                </p>
                {savedStats && (
                  <>
                    <p className="text-zinc-400">Best Score: {savedStats.bestScore}</p>
                    <p className="text-zinc-400">Best Reaction: {savedStats.bestReactionTime.toFixed(0)}ms</p>
                  </>
                )}
              </>
            )}
          </div>
        }
      />

      {/* Stats Modal */}
      {showStats && savedStats && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30">
          <div className="bg-zinc-900 border-2 border-orange-500 rounded-3xl p-10 text-center max-w-md">
            <h2 className="text-4xl font-black text-orange-400 mb-6">Statistics</h2>
            <div className="space-y-3 text-left">
              <p className="text-white">Total Games: {savedStats.totalGames}</p>
              <p className="text-white">Average Score: {savedStats.averageScore.toFixed(0)}</p>
              <p className="text-white">Average Reaction: {savedStats.averageReactionTime.toFixed(0)}ms</p>
              <p className="text-white">Best Score: {savedStats.bestScore}</p>
              <p className="text-white">Best Reaction: {savedStats.bestReactionTime.toFixed(0)}ms</p>
              <p className="text-white">Hit Rate: {(savedStats.hitRate * 100).toFixed(1)}%</p>
            </div>
            <button
              onClick={() => setShowStats(false)}
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30">
          <div className="bg-zinc-900 border-2 border-orange-500 rounded-3xl p-10 text-center max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-4xl font-black text-orange-400 mb-6">How to Play</h2>
            <div className="text-left space-y-4 text-zinc-300">
              <div>
                <p className="font-bold text-white mb-1">Objective:</p>
                <p>Tap targets as fast as you can before time runs out!</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Rules Change:</p>
                <p>Follow the instructions that appear during the game. Rules change every few seconds.</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Target Types:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Orange/Blue/Green: Normal targets (10 points)</li>
                  <li>Red with ❌: Decoy - avoid these! (-20 points)</li>
                  <li>Purple with ⚡: Power-up (+50 points + bonus)</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Power-ups:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Extra Time: Adds 5 seconds</li>
                  <li>Slow Motion: Slows spawn rate</li>
                  <li>Double Score: 2x points for 10 seconds</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Streaks:</p>
                <p>Consecutive hits increase your score multiplier!</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Controls:</p>
                <p>Click targets or use Enter/Space on focused targets. Press P or Escape to pause.</p>
              </div>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors w-full"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
