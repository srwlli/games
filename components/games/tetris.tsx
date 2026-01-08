"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"

// Tetromino shapes (4x4 grid representation)
const SHAPES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-cyan-500",
  },
  O: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-yellow-500",
  },
  T: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-purple-500",
  },
  S: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-green-500",
  },
  Z: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-red-500",
  },
  J: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
    ],
    color: "bg-blue-500",
  },
  L: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
    ],
    color: "bg-orange-500",
  },
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_FALL_SPEED = 1000

type ShapeKey = keyof typeof SHAPES
type GameState = "playing" | "paused" | "gameOver"

interface Piece {
  shape: number[][]
  color: string
  x: number
  y: number
  type: ShapeKey
}

const createEmptyBoard = () =>
  Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null))

const getRandomPiece = (): Piece => {
  const shapes = Object.keys(SHAPES) as ShapeKey[]
  const randomKey = shapes[Math.floor(Math.random() * shapes.length)]
  const { shape, color } = SHAPES[randomKey]

  return {
    shape,
    color,
    x: Math.floor(BOARD_WIDTH / 2) - 2,
    y: 0,
    type: randomKey,
  }
}

export default function Tetris() {
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState<Piece>(getRandomPiece())
  const [nextPiece, setNextPiece] = useState<Piece>(getRandomPiece())
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [linesCleared, setLinesCleared] = useState(0)
  const [gameState, setGameState] = useState<GameState>("playing")
  const [fallSpeed, setFallSpeed] = useState(INITIAL_FALL_SPEED)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Check collision
  const checkCollision = useCallback((piece: Piece, board: (string | null)[][], offsetX = 0, offsetY = 0) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX
          const newY = piece.y + y + offsetY

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && board[newY]?.[newX])) {
            return true
          }
        }
      }
    }
    return false
  }, [])

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rotated = piece.shape[0].map((_, i) => piece.shape.map((row) => row[i]).reverse())
    return rotated
  }, [])

  // Lock piece to board
  const lockPiece = useCallback(() => {
    const newBoard = board.map((row) => [...row])

    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y
          const boardX = currentPiece.x + x
          if (boardY >= 0 && boardY < BOARD_HEIGHT) {
            newBoard[boardY][boardX] = currentPiece.color
          }
        }
      }
    }

    // Check for completed lines
    const completedLines: number[] = []
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every((cell) => cell !== null)) {
        completedLines.push(y)
      }
    }

    // Remove completed lines
    if (completedLines.length > 0) {
      completedLines.forEach((line) => {
        newBoard.splice(line, 1)
        newBoard.unshift(Array(BOARD_WIDTH).fill(null))
      })

      // Update score
      const lineScores = [100, 300, 500, 800]
      const points = lineScores[completedLines.length - 1] * level
      setScore((prev) => prev + points)
      setLinesCleared((prev) => {
        const newTotal = prev + completedLines.length
        const newLevel = Math.floor(newTotal / 10) + 1
        if (newLevel > level) {
          setLevel(newLevel)
          setFallSpeed(Math.max(100, INITIAL_FALL_SPEED - (newLevel - 1) * 100))
          setShowLevelUp(true)
          setTimeout(() => setShowLevelUp(false), 2000)
        }
        return newTotal
      })
    }

    setBoard(newBoard)

    // Check game over
    if (checkCollision(nextPiece, newBoard)) {
      setGameState("gameOver")
      return
    }

    setCurrentPiece(nextPiece)
    setNextPiece(getRandomPiece())
  }, [board, currentPiece, nextPiece, level, checkCollision])

  // Move piece down
  const moveDown = useCallback(() => {
    if (gameState !== "playing") return

    if (!checkCollision(currentPiece, board, 0, 1)) {
      setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }))
    } else {
      lockPiece()
    }
  }, [currentPiece, board, gameState, checkCollision, lockPiece])

  // Move piece left/right
  const moveHorizontal = useCallback(
    (direction: number) => {
      if (gameState !== "playing") return

      if (!checkCollision(currentPiece, board, direction, 0)) {
        setCurrentPiece((prev) => ({ ...prev, x: prev.x + direction }))
      }
    },
    [currentPiece, board, gameState, checkCollision],
  )

  // Rotate
  const handleRotate = useCallback(() => {
    if (gameState !== "playing") return

    const rotated = rotatePiece(currentPiece)
    const newPiece = { ...currentPiece, shape: rotated }

    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece)
    }
  }, [currentPiece, board, gameState, checkCollision, rotatePiece])

  // Hard drop
  const hardDrop = useCallback(() => {
    if (gameState !== "playing") return

    let dropDistance = 0
    while (!checkCollision(currentPiece, board, 0, dropDistance + 1)) {
      dropDistance++
    }

    setCurrentPiece((prev) => ({ ...prev, y: prev.y + dropDistance }))
    setScore((prev) => prev + dropDistance * 2)
    setTimeout(lockPiece, 50)
  }, [currentPiece, board, gameState, checkCollision, lockPiece])

  const handleRestart = useCallback(() => {
    setBoard(createEmptyBoard())
    setCurrentPiece(getRandomPiece())
    setNextPiece(getRandomPiece())
    setScore(0)
    setLevel(1)
    setLinesCleared(0)
    setGameState("playing")
    setFallSpeed(INITIAL_FALL_SPEED)
  }, [])

  const togglePause = useCallback(() => {
    setGameState((prev) => (prev === "playing" ? "paused" : "playing"))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") {
        if (e.key === "Enter" && gameState === "gameOver") {
          handleRestart()
        }
        if (e.key === "p" || e.key === "P" || e.key === "Escape") {
          if (gameState === "paused") setGameState("playing")
        }
        return
      }

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault()
          moveHorizontal(-1)
          break
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault()
          moveHorizontal(1)
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          moveDown()
          setScore((prev) => prev + 1)
          break
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault()
          handleRotate()
          break
        case " ":
          e.preventDefault()
          hardDrop()
          break
        case "p":
        case "P":
        case "Escape":
          e.preventDefault()
          togglePause()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, moveHorizontal, moveDown, handleRotate, hardDrop, handleRestart, togglePause])

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Tap to rotate
    if (absX < 30 && absY < 30 && deltaTime < 200) {
      handleRotate()
    }
    // Swipe left/right
    else if (absX > absY && absX > 50) {
      moveHorizontal(deltaX > 0 ? 1 : -1)
    }
    // Swipe down for hard drop
    else if (absY > absX && deltaY > 50) {
      hardDrop()
    }

    touchStartRef.current = null
  }

  // Game loop
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = setInterval(moveDown, fallSpeed)
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      }
    }
  }, [moveDown, fallSpeed, gameState])

  // Render board with current piece
  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row])

    // Draw current piece on display board
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y
          const boardX = currentPiece.x + x
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = currentPiece.color
          }
        }
      }
    }

    // Draw ghost piece
    let ghostY = currentPiece.y
    while (!checkCollision({ ...currentPiece, y: ghostY + 1 }, board)) {
      ghostY++
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => {
          // Check if this cell is part of ghost piece
          let isGhost = false
          for (let py = 0; py < currentPiece.shape.length; py++) {
            for (let px = 0; px < currentPiece.shape[py].length; px++) {
              if (currentPiece.shape[py][px] && ghostY + py === y && currentPiece.x + px === x && !cell) {
                isGhost = true
              }
            }
          }

          return (
            <div
              key={x}
              className={`w-6 h-6 border border-zinc-800 ${
                cell || ""
              } ${isGhost ? `${currentPiece.color} opacity-20` : ""}`}
            />
          )
        })}
      </div>
    ))
  }

  // Render next piece preview
  const renderNextPiece = () => {
    if (!nextPiece || !nextPiece.shape) return null

    return (
      <div className="flex flex-col">
        {nextPiece.shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div key={x} className={`w-4 h-4 border border-zinc-800 ${cell ? nextPiece.color : ""}`} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!currentPiece || !board) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-purple-950 to-zinc-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="h-full w-full bg-gradient-to-b from-purple-950 to-zinc-950 flex flex-col items-center justify-center p-4 touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stats Bar */}
      <StatsBar
        stats={[
          { label: "Score", value: score, color: "emerald", size: "simple" },
          { label: "Level", value: level, color: "purple", size: "simple" },
          { label: "Lines", value: linesCleared, color: "cyan", size: "simple" },
        ]}
        layout="inline"
        className="w-full max-w-md mb-4 text-white"
      />

      {/* Main Game Area */}
      <div className="flex gap-4 items-start">
        {/* Game Board */}
        <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-700 backdrop-blur-sm">{renderBoard()}</div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Next Piece */}
          <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700 backdrop-blur-sm">
            <div className="text-xs text-zinc-400 mb-2 text-center">Next</div>
            <div className="flex justify-center">{renderNextPiece()}</div>
          </div>

          {/* Controls */}
          <button
            onClick={togglePause}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium border border-zinc-700"
          >
            {gameState === "playing" ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Touch Guide */}
      <div className="mt-4 text-xs text-zinc-500 text-center max-w-md">
        <div className="space-y-1">
          <div>Tap to rotate • Swipe left/right to move</div>
          <div>Swipe down for instant drop</div>
          <div className="mt-2 text-zinc-600">Keyboard: Arrow keys or WASD • Space for hard drop • P to pause</div>
        </div>
      </div>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-purple-500 text-white px-8 py-4 rounded-xl text-2xl font-bold">Level {level}!</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Overlay */}
      <AnimatePresence>
        {gameState === "paused" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center"
          >
            <div className="text-white text-3xl font-bold">Paused</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <GameOverModal
        isOpen={gameState === "gameOver"}
        title="Game Over"
        score={score}
        accentColor="red"
        onPlayAgain={handleRestart}
        additionalContent={
          <div className="text-zinc-400 mb-6">
            Level {level} • {linesCleared} lines
          </div>
        }
        buttonText="Play Again"
      />
    </div>
  )
}
