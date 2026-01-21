"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GameOverModal, StartScreen, CountdownOverlay, UnifiedHUD } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useInterval } from "@/hooks/use-interval"
import { useDelayedAction } from "@/hooks/use-delayed-action"
import { useTetrisEngine } from "@/hooks/use-tetris-engine"
import { useStartCountdown } from "@/hooks/use-start-countdown"
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"
import { BoardRow } from "./tetris/board-row"
import { MobileControls } from "./tetris/mobile-controls"
import { LineClearAnimation } from "./tetris/line-clear-animation"
import { ScorePopup } from "./tetris/score-popup"
import { getCellStyle } from "@/lib/tetris/cell-styles"
import { CellType } from "@/lib/tetris/types"
import { soundManager } from "@/lib/tetris/sounds"

export default function Tetris() {
  const { state: gameState, isPlaying, isPaused, isGameOver, pause, resume, gameOver, reset, start } = useGameState({
    initialState: "idle",
  })
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [clearedLines, setClearedLines] = useState<number[]>([])
  const [scorePopup, setScorePopup] = useState<{ score: number; x: number; y: number } | null>(null)
  const [lastScore, setLastScore] = useState(0)
  const { countdown, startCountdown, resetCountdown } = useStartCountdown({
    onComplete: () => {},
  })
  const { updateScore, endGameSession, setTimerPaused, liveTime } = useGameSessionIntegration("tetris")

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchMoveRef = useRef<{ lastX: number; lastY: number; lastTime: number } | null>(null)

  const engine = useTetrisEngine({
    isPlaying,
    onGameOver: () => {
      gameOver()
    },
    onLevelUp: (newLevel) => {
      setShowLevelUp(true)
    },
  })

  useEffect(() => {
    if (engine.score > lastScore) {
      const increase = engine.score - lastScore
      if (increase > 0) {
        setScorePopup({ score: increase, x: 200, y: 300 })
        setTimeout(() => setScorePopup(null), 600)
      }
      setLastScore(engine.score)
    }
  }, [engine.score, lastScore])

  useEffect(() => {
    if (engine.lastClearedLines.length > 0) {
      soundManager.clear(engine.lastClearedLines.length)
    }
  }, [engine.lastClearedLines])

  useEffect(() => {
    if (showLevelUp) {
      soundManager.levelUp()
    }
  }, [showLevelUp])

  useEffect(() => {
    if (isGameOver) {
      soundManager.gameOver()
      endGameSession(engine.score, { level: engine.level, lines: engine.linesCleared })
    }
  }, [isGameOver, engine.score, engine.level, engine.linesCleared, endGameSession])

  useEffect(() => {
    setTimerPaused(isPaused || countdown !== null)
  }, [isPaused, countdown, setTimerPaused])

  useEffect(() => {
    updateScore(engine.score)
  }, [engine.score, updateScore])

  useInterval(engine.tick, engine.fallSpeed, isPlaying && countdown === null)

  useDelayedAction(() => {
    setShowLevelUp(false)
  }, 2000, showLevelUp)

  const handleRestart = useCallback(() => {
    engine.reset()
    reset()
    resetCountdown()
  }, [engine, reset, resetCountdown])

  const handleStart = useCallback(() => {
    engine.reset()
    start()
    startCountdown()
  }, [engine, start, startCountdown])

  const togglePause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else if (isPaused) {
      resume()
    }
  }, [isPlaying, isPaused, pause, resume])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "idle") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleStart()
        }
        return
      }

      if (!isPlaying) {
        if (e.key === "Enter" && isGameOver) {
          handleRestart()
        }
        if (e.key === "p" || e.key === "P" || e.key === "Escape") {
          if (isPaused) resume()
        }
        return
      }

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault()
          engine.moveLeft()
          soundManager.move()
          break
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault()
          engine.moveRight()
          soundManager.move()
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          engine.moveDown()
          soundManager.move()
          break
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault()
          engine.rotate()
          soundManager.rotate()
          break
        case "c":
        case "C":
          e.preventDefault()
          engine.holdPiece()
          break
        case " ":
          e.preventDefault()
          engine.hardDrop()
          soundManager.hardDrop()
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
  }, [gameState, isPlaying, isPaused, isGameOver, engine, handleRestart, togglePause, resume, handleStart])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    touchMoveRef.current = { lastX: touch.clientX, lastY: touch.clientY, lastTime: Date.now() }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchMoveRef.current || !isPlaying) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchMoveRef.current.lastX
    const deltaTime = Date.now() - touchMoveRef.current.lastTime
    if (deltaTime > 100) {
      if (Math.abs(deltaX) > 20) {
        if (deltaX > 0) engine.moveRight()
        else engine.moveLeft()
        touchMoveRef.current.lastX = touch.clientX
        touchMoveRef.current.lastTime = Date.now()
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    if (absX < 30 && absY < 30 && deltaTime < 200) engine.rotate()
    else if (absX > absY && absX > 50 && deltaTime < 300) {
      if (deltaX > 0) engine.moveRight()
      else engine.moveLeft()
    } else if (absY > absX && deltaY > 50) engine.hardDrop()
    touchStartRef.current = null
    touchMoveRef.current = null
  }

  const ghostY = useMemo(() => engine.ghostY, [engine.ghostY])

  const displayBoard = useMemo(() => {
    const board = engine.board.map((row) => [...row])
    for (let y = 0; y < engine.currentPiece.shape.length; y++) {
      for (let x = 0; x < engine.currentPiece.shape[y].length; x++) {
        if (engine.currentPiece.shape[y][x]) {
          const boardY = engine.currentPiece.y + y
          const boardX = engine.currentPiece.x + x
          if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
            board[boardY][boardX] = engine.currentPiece.cellType
          }
        }
      }
    }
    return board
  }, [engine.board, engine.currentPiece])

  const renderBoard = () => {
    return displayBoard.map((row, y) => (
      <BoardRow key={y} row={row} rowIndex={y} currentPiece={engine.currentPiece} ghostY={ghostY} />
    ))
  }

  const renderNextPiece = () => {
    if (!engine.nextPiece || !engine.nextPiece.shape) return null
    const nextPieceStyle = getCellStyle(engine.nextPiece.cellType)
    return (
      <div className="flex flex-col">
        {engine.nextPiece.shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div key={x} className={`w-4 h-4 border border-zinc-800 ${cell ? nextPieceStyle : ""}`} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!engine.currentPiece || !engine.board) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-purple-950 to-zinc-950 flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return (
    <div
      className="h-full w-full bg-gradient-to-b from-purple-950 to-zinc-950 flex flex-col items-center justify-between p-4 sm:p-6 touch-none select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="application"
      aria-label="Tetris game"
    >
      <UnifiedHUD
        stats={[
          { label: "Score", value: engine.score, color: "emerald" },
          { label: "Time", value: Math.floor(liveTime / 1000) + "s", color: "orange" },
          { label: "Level", value: engine.level, color: "purple" },
        ]}
        className="w-full max-w-md"
      />

      <div className="flex-grow flex items-center justify-center w-full min-h-0 py-4">
        <div className="flex gap-4 items-start max-h-full">
          <div
            className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-700 backdrop-blur-sm h-full flex flex-col justify-center"
            role="grid"
            aria-label="Game board"
            style={{ height: "min(60vh, 500px)", aspectRatio: "10/20" }}
          >
            {renderBoard()}
          </div>

          <div className="flex flex-col gap-4">
            {engine.heldPiece && (
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700 backdrop-blur-sm">
                <div className="text-xs text-zinc-400 mb-2 text-center">Hold</div>
                <div className="flex justify-center items-center min-h-[64px]">
                  <div className="flex flex-col">
                    {engine.heldPiece.shape.map((row, y) => (
                      <div key={y} className="flex">
                        {row.map((cell, x) => {
                          const cellStyle = getCellStyle(engine.heldPiece!.cellType)
                          return <div key={x} className={`w-4 h-4 border border-zinc-800 ${cell ? cellStyle : ""}`} />
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700 backdrop-blur-sm">
              <div className="text-xs text-zinc-400 mb-2 text-center">Next</div>
              <div className="flex justify-center items-center min-h-[64px]">{renderNextPiece()}</div>
            </div>

            <button
              onClick={togglePause}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium border border-zinc-700"
            >
              {isPlaying ? "Pause" : "Resume"}
            </button>
          </div>
        </div>
      </div>

      <LineClearAnimation lines={engine.lastClearedLines} isVisible={engine.lastClearedLines.length > 0} />
      {scorePopup && <ScorePopup score={scorePopup.score} x={scorePopup.x} y={scorePopup.y} isVisible={true} />}

      <MobileControls
        onMoveLeft={engine.moveLeft}
        onMoveRight={engine.moveRight}
        onMoveDown={engine.moveDown}
        onRotate={engine.rotate}
        onHardDrop={engine.hardDrop}
        isPlaying={isPlaying}
      />

      <div className="mt-4 text-xs text-zinc-500 text-center max-w-md hidden md:block">
        <div className="space-y-1">
          <div>Tap to rotate • Swipe left/right to move</div>
          <div>Swipe down for instant drop</div>
          <div className="mt-2 text-zinc-600">Keyboard: Arrow keys or WASD • Space for hard drop • P to pause</div>
        </div>
      </div>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-purple-500 text-white px-8 py-4 rounded-xl text-2xl font-bold">
              Level {engine.level}!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameState === "idle" && (
        <StartScreen
          title="TETRIS"
          description="Ready to clear some lines?"
          onStart={handleStart}
          accentColor="purple"
          controls={["Arrows / WASD to Move & Rotate", "Space for Hard Drop", "P to Pause"]}
        />
      )}

      <CountdownOverlay count={countdown} accentColor="purple" />

      <AnimatePresence>
        {isPaused && (
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

      <GameOverModal
        isOpen={isGameOver}
        title="Game Over"
        score={engine.score}
        accentColor="red"
        onPlayAgain={handleRestart}
        additionalContent={
          <div className="text-zinc-400 mb-6">
            Level {engine.level} • {engine.linesCleared} lines
          </div>
        }
        buttonText="Play Again"
      />
    </div>
  )
}
