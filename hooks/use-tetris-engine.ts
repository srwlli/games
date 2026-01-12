"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Piece, Board, GameState, GameConfig } from "@/lib/tetris/types"
import { DEFAULT_CONFIG } from "@/lib/tetris/config"
import {
  checkCollision,
  attemptWallKick,
  createPiece,
  createEmptyBoard,
  lockPieceToBoard,
  clearLines,
  calculateFallSpeed,
  calculateGhostY,
} from "@/lib/tetris/engine"
import { CellType } from "@/lib/tetris/types"

export interface UseTetrisEngineOptions {
  config?: Partial<GameConfig>
  isPlaying?: boolean
  onGameOver?: () => void
  onLevelUp?: (level: number) => void
}

export interface UseTetrisEngineReturn {
  board: Board
  currentPiece: Piece
  nextPiece: Piece
  heldPiece: Piece | null
  score: number
  level: number
  linesCleared: number
  fallSpeed: number
  ghostY: number
  lockDelayActive: boolean
  lastClearedLines: number[] // For animation feedback
  canHold: boolean // Whether hold is available (can only hold once per piece)
  moveLeft: () => void
  moveRight: () => void
  moveDown: () => void
  rotate: () => void
  hardDrop: () => void
  holdPiece: () => void
  reset: () => void
  tick: () => void
  resetLockDelay: () => void
}

/**
 * Tetris game engine hook with refs to avoid stale closures
 * All game logic is extracted from UI component
 */
export function useTetrisEngine(options: UseTetrisEngineOptions = {}): UseTetrisEngineReturn {
  const config: GameConfig = { ...DEFAULT_CONFIG, ...options.config }
  const { isPlaying = false, onGameOver, onLevelUp } = options

  // State
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(config))
  const [currentPiece, setCurrentPiece] = useState<Piece>(() => createPiece(config))
  const [nextPiece, setNextPiece] = useState<Piece>(() => createPiece(config))
  const [heldPiece, setHeldPiece] = useState<Piece | null>(null)
  const [canHold, setCanHold] = useState(true)
  const [score, setScore] = useState(0)
  
  // Refs for hold piece
  const heldPieceRef = useRef<Piece | null>(null)
  const canHoldRef = useRef<boolean>(true)
  const [level, setLevel] = useState(1)
  const [linesCleared, setLinesCleared] = useState(0)
  const [fallSpeed, setFallSpeed] = useState(config.initialFallSpeed)
  const [lockDelayTimer, setLockDelayTimer] = useState<number | null>(null)
  const [lockDelayResetsRemaining, setLockDelayResetsRemaining] = useState(config.lockDelayResets)
  const [lastClearedLines, setLastClearedLines] = useState<number[]>([])

  // Refs to avoid stale closures
  const boardRef = useRef<Board>(board)
  const currentPieceRef = useRef<Piece>(currentPiece)
  const nextPieceRef = useRef<Piece>(nextPiece)
  const levelRef = useRef<number>(level)
  const lockDelayTimerRef = useRef<number | null>(null)
  const lockDelayResetsRemainingRef = useRef<number>(config.lockDelayResets)
  const isPlayingRef = useRef<boolean>(isPlaying)

  // Keep refs in sync with state
  useEffect(() => {
    boardRef.current = board
  }, [board])

  useEffect(() => {
    currentPieceRef.current = currentPiece
  }, [currentPiece])

  useEffect(() => {
    nextPieceRef.current = nextPiece
  }, [nextPiece])

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    lockDelayTimerRef.current = lockDelayTimer
  }, [lockDelayTimer])

  useEffect(() => {
    lockDelayResetsRemainingRef.current = lockDelayResetsRemaining
  }, [lockDelayResetsRemaining])

  useEffect(() => {
    heldPieceRef.current = heldPiece
  }, [heldPiece])

  useEffect(() => {
    canHoldRef.current = canHold
  }, [canHold])

  // Lock piece with lock delay (Infinity mechanic)
  const lockPiece = useCallback(() => {
    const currentBoard = boardRef.current
    const current = currentPieceRef.current
    const next = nextPieceRef.current
    const currentLevel = levelRef.current

    // Lock piece to board
    const newBoard = lockPieceToBoard(current, currentBoard, config)

    // Clear lines
    const clearResult = clearLines(newBoard, currentLevel, config)

    // Update state
    setBoard(clearResult.newBoard)
    setScore((prev) => prev + clearResult.scoreIncrease)

    if (clearResult.linesCleared.length > 0) {
      setLastClearedLines(clearResult.linesCleared)
      // Clear animation after 1 second
      setTimeout(() => setLastClearedLines([]), 1000)

      setLinesCleared((prev) => {
        const newTotal = prev + clearResult.linesCleared.length
        const newLevel = Math.floor(newTotal / config.levelUpLines) + 1

        if (newLevel > currentLevel) {
          setLevel(newLevel)
          const newFallSpeed = calculateFallSpeed(newLevel, config)
          setFallSpeed(newFallSpeed)
          onLevelUp?.(newLevel)
        }

        return newTotal
      })
    }

    // Check game over - next piece cannot spawn at its default position
    // This happens when the spawn area (top rows) is blocked by locked pieces
    if (checkCollision(next, clearResult.newBoard, 0, 0, config)) {
      // Additional validation: verify spawn area is actually blocked
      // Check top 4 rows (typical spawn area) to ensure game over is legitimate
      const spawnAreaBlocked = clearResult.newBoard
        .slice(0, 4) // Check top 4 rows (spawn area)
        .some((row) => row.some((cell) => cell !== null))

      if (spawnAreaBlocked) {
        onGameOver?.()
        return
      }
      // If spawn area check fails but collision detected, still trigger game over
      // This handles edge cases where piece shape extends beyond spawn area
      onGameOver?.()
      return
    }

    // Spawn next piece
    setCurrentPiece(next)
    setNextPiece(createPiece(config))
    setCanHold(true) // Allow holding again after new piece spawns

    // Reset lock delay
    setLockDelayTimer(null)
    setLockDelayResetsRemaining(config.lockDelayResets)
  }, [config, onGameOver, onLevelUp])

  // Lock delay management (Infinity mechanic) - defined before use in moveDown/tick
  const startLockDelay = useCallback(() => {
    // Check if we have resets remaining
    if (lockDelayResetsRemainingRef.current <= 0) {
      // No resets left - force lock immediately
      lockPiece()
      return
    }

    // If timer already running, don't restart it
    if (lockDelayTimerRef.current !== null) return

    const timer = window.setTimeout(() => {
      // Lock delay expired - force lock
      lockPiece()
      setLockDelayTimer(null)
    }, config.lockDelayMs)

    setLockDelayTimer(timer)
  }, [config, lockPiece])

  const resetLockDelay = useCallback(() => {
    // Clear existing timer
    if (lockDelayTimerRef.current !== null) {
      clearTimeout(lockDelayTimerRef.current)
      setLockDelayTimer(null)
    }

    // Decrement resets when piece moves (Infinity mechanic)
    // If resets run out, the next collision will force lock
    setLockDelayResetsRemaining((prev) => {
      if (prev > 0) {
        return prev - 1
      }
      return 0
    })
  }, [])

  // Hold piece (swap current with held)
  const holdPiece = useCallback(() => {
    if (!isPlayingRef.current || !canHoldRef.current) return

    const current = currentPieceRef.current
    const held = heldPieceRef.current

    if (held === null) {
      // First hold - store current, spawn next
      setHeldPiece(current)
      setCurrentPiece(nextPieceRef.current)
      setNextPiece(createPiece(config))
    } else {
      // Swap current with held
      setHeldPiece(current)
      setCurrentPiece(held)
    }

    setCanHold(false) // Can only hold once per piece
  }, [config])

  // Move piece left
  const moveLeft = useCallback(() => {
    if (!isPlayingRef.current) return

    const current = currentPieceRef.current
    const currentBoard = boardRef.current

    if (!checkCollision(current, currentBoard, -1, 0, config)) {
      setCurrentPiece((prev) => ({ ...prev, x: prev.x - 1 }))
      resetLockDelay()
    }
  }, [config, resetLockDelay])

  // Move piece right
  const moveRight = useCallback(() => {
    if (!isPlayingRef.current) return

    const current = currentPieceRef.current
    const currentBoard = boardRef.current

    if (!checkCollision(current, currentBoard, 1, 0, config)) {
      setCurrentPiece((prev) => ({ ...prev, x: prev.x + 1 }))
      resetLockDelay()
    }
  }, [config, resetLockDelay])

  // Move piece down
  const moveDown = useCallback(() => {
    if (!isPlayingRef.current) return

    const current = currentPieceRef.current
    const currentBoard = boardRef.current

    if (!checkCollision(current, currentBoard, 0, 1, config)) {
      // Can move down - move and reset lock delay
      setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }))
      resetLockDelay()
    } else {
      // Collision detected - start lock delay if not already active
      if (lockDelayTimerRef.current === null) {
        startLockDelay()
      }
    }
  }, [config, startLockDelay, resetLockDelay])

  // Rotate piece with wall kicks
  const rotate = useCallback(() => {
    if (!isPlayingRef.current) return

    const current = currentPieceRef.current
    const currentBoard = boardRef.current

    const kickedPiece = attemptWallKick(current, currentBoard, config)
    if (kickedPiece) {
      setCurrentPiece(kickedPiece)
      resetLockDelay()
    }
  }, [config, resetLockDelay])

  // Hard drop (deterministic - no setTimeout)
  const hardDrop = useCallback(() => {
    if (!isPlayingRef.current) return

    const current = currentPieceRef.current
    const currentBoard = boardRef.current

    let dropDistance = 0
    while (!checkCollision(current, currentBoard, 0, dropDistance + 1, config)) {
      dropDistance++
    }

    if (dropDistance > 0) {
      // Calculate dropped piece position
      const droppedPiece = { ...current, y: current.y + dropDistance }

      // Update ref immediately so lockPiece uses correct position
      currentPieceRef.current = droppedPiece

      // Update state
      setCurrentPiece(droppedPiece)
      setScore((prev) => prev + dropDistance * config.scoring.hardDrop)

      // Lock immediately with correct position
      lockPiece()
    } else {
      // If dropDistance === 0, piece is already at bottom
      // Start lock delay so piece locks properly (handled by normal game logic)
      if (lockDelayTimerRef.current === null) {
        startLockDelay()
      }
    }
  }, [config, lockPiece, startLockDelay])

  // Game tick (gravity)
  const tick = useCallback(() => {
    if (!isPlayingRef.current) return

    const current = currentPieceRef.current
    const currentBoard = boardRef.current

    if (!checkCollision(current, currentBoard, 0, 1, config)) {
      // Can move down - move and reset lock delay
      setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }))
      resetLockDelay()
    } else {
      // Collision detected - check if lock delay is already active
      if (lockDelayTimerRef.current === null) {
        // Start lock delay only if not already active
        startLockDelay()
      }
      // If lock delay is active, piece stays in place but can still be moved/rotated
      // The lock will happen when timer expires or resets run out
    }
  }, [config, startLockDelay, resetLockDelay])

  // Reset game
  const reset = useCallback(() => {
    // Clear lock delay timer
    if (lockDelayTimerRef.current !== null) {
      clearTimeout(lockDelayTimerRef.current)
    }

    setBoard(createEmptyBoard(config))
    setCurrentPiece(createPiece(config))
    setNextPiece(createPiece(config))
    setHeldPiece(null)
    setCanHold(true)
    setScore(0)
    setLevel(1)
    setLinesCleared(0)
    setFallSpeed(config.initialFallSpeed)
    setLockDelayTimer(null)
    setLockDelayResetsRemaining(config.lockDelayResets)
    setLastClearedLines([])
  }, [config])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lockDelayTimerRef.current !== null) {
        clearTimeout(lockDelayTimerRef.current)
      }
    }
  }, [])

  // Calculate ghost Y position (memoized in component)
  const ghostY = calculateGhostY(currentPiece, board, config)

  return {
    board,
    currentPiece,
    nextPiece,
    heldPiece,
    score,
    level,
    linesCleared,
    fallSpeed,
    ghostY,
    lockDelayActive: lockDelayTimer !== null,
    lastClearedLines,
    canHold,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    holdPiece,
    reset,
    tick,
    resetLockDelay,
  }
}
