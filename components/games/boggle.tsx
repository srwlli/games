"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useCountdown } from "@/hooks/use-countdown"
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"
import { DictionaryService } from "@/lib/word-games/trie/trie-service"
import { generateBoard, calculateBoggleScore, validateWord, solveBoard, BOGGLE_DICE } from "@/lib/word-games/boggle/engine"
import { BOGGLE_CONFIG } from "@/lib/word-games/boggle/config"
import type { BogglePath, BogglePosition } from "@/lib/word-games/boggle/types"

export default function Boggle() {
  const { isPlaying, isPaused, isGameOver, pause, resume, gameOver, reset, start } = useGameState({
    initialState: "idle",
  })
  const { updateScore, endGameSession } = useGameSessionIntegration("boggle")

  const [board, setBoard] = useState<string[][]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [currentPath, setCurrentPath] = useState<BogglePath>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWordsMissed, setShowWordsMissed] = useState(false)
  const [allWords, setAllWords] = useState<Set<string>>(new Set())

  const touchStartRef = useRef<{ row: number; col: number } | null>(null)
  const isDrawingRef = useRef(false)

  const { timeLeft, reset: resetTimer } = useCountdown(
    BOGGLE_CONFIG.TIME_LIMIT_SECONDS,
    () => {
      handleGameOver()
    },
    isPlaying && !isPaused,
  )

  // Initialize dictionary on mount
  useEffect(() => {
    const initDictionary = async () => {
      try {
        const dict = DictionaryService.getInstance()
        await dict.init()
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load dictionary:", error)
        setIsLoading(false)
      }
    }
    initDictionary()
  }, [])

  // Initialize game
  const startGame = useCallback(() => {
    const newBoard = generateBoard()
    setBoard(newBoard)
    setFoundWords(new Set())
    setScore(0)
    setCurrentPath([])
    setShowWordsMissed(false)
    resetTimer()
    start()
  }, [start, resetTimer])

  // Handle game over
  const handleGameOver = useCallback(() => {
    gameOver()
    endGameSession(score, {
      wordsFound: foundWords.size,
      totalWords: allWords.size,
    })
  }, [gameOver, score, foundWords.size, allWords.size, endGameSession])

  // Get cell position from touch/click coordinates
  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number, container: HTMLElement): BogglePosition | null => {
      const rect = container.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      const cellSize = rect.width / BOGGLE_CONFIG.GRID_SIZE
      const col = Math.floor(x / cellSize)
      const row = Math.floor(y / cellSize)

      if (row >= 0 && row < BOGGLE_CONFIG.GRID_SIZE && col >= 0 && col < BOGGLE_CONFIG.GRID_SIZE) {
        return { row, col }
      }
      return null
    },
    [],
  )

  // Check if position is adjacent to last in path
  const isAdjacent = useCallback((pos1: BogglePosition, pos2: BogglePosition): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row)
    const colDiff = Math.abs(pos1.col - pos2.col)
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)
  }, [])

  // Check if position is already in path
  const isInPath = useCallback((path: BogglePath, pos: BogglePosition): boolean => {
    return path.some((p) => p.row === pos.row && p.col === pos.col)
  }, [])

  // Handle touch/click start
  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent, container: HTMLElement) => {
      if (!isPlaying || isPaused || board.length === 0) return

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      const cell = getCellFromPoint(clientX, clientY, container)
      if (cell) {
        touchStartRef.current = cell
        isDrawingRef.current = true
        setCurrentPath([cell])
        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(10)
        }
      }
    },
    [isPlaying, isPaused, board, getCellFromPoint],
  )

  // Handle touch/click move
  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent, container: HTMLElement) => {
      if (!isDrawingRef.current || !touchStartRef.current || !isPlaying || isPaused) return

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      const cell = getCellFromPoint(clientX, clientY, container)
      if (cell) {
        setCurrentPath((prev) => {
          if (isInPath(prev, cell)) {
            // Allow backtracking - remove from path
            const index = prev.findIndex((p) => p.row === cell.row && p.col === cell.col)
            if (index >= 0) {
              return prev.slice(0, index + 1)
            }
          } else if (prev.length === 0 || isAdjacent(prev[prev.length - 1], cell)) {
            // Add to path if adjacent
            return [...prev, cell]
          }
          return prev
        })
      }
    },
    [isPlaying, isPaused, getCellFromPoint, isAdjacent, isInPath],
  )

  // Handle touch/click end
  const handleEnd = useCallback(() => {
    if (!isDrawingRef.current || currentPath.length === 0) {
      setCurrentPath([])
      isDrawingRef.current = false
      return
    }

    // Build word from path
    const word = currentPath
      .map((pos) => {
        const letter = board[pos.row][pos.col]
        return letter === "QU" ? "Q" : letter
      })
      .join("")

    // Validate word
    if (word.length >= BOGGLE_CONFIG.MIN_WORD_LENGTH && validateWord(word, board, currentPath)) {
      if (!foundWords.has(word)) {
        const wordScore = calculateBoggleScore(word)
        setFoundWords((prev) => new Set([...prev, word]))
        setScore((prev) => {
          const newScore = prev + wordScore
          updateScore(newScore)
          return newScore
        })
        // Haptic feedback for valid word
        if ("vibrate" in navigator) {
          navigator.vibrate(20)
        }
      }
    }

    setCurrentPath([])
    isDrawingRef.current = false
    touchStartRef.current = null
  }, [currentPath, board, foundWords, updateScore])

  // Solve board for "Words You Missed"
  const handleShowWordsMissed = useCallback(() => {
    if (board.length === 0) return
    const solved = solveBoard(board)
    setAllWords(solved)
    setShowWordsMissed(true)
  }, [board])

  // Update score in session
  useEffect(() => {
    updateScore(score)
  }, [score, updateScore])

  // Handle restart
  const handleRestart = useCallback(() => {
    reset()
    startGame()
  }, [reset, startGame])

  const togglePause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else if (isPaused) {
      resume()
    }
  }, [isPlaying, isPaused, pause, resume])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-4">Loading Dictionary...</div>
          <div className="text-zinc-400">Please wait</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black touch-none" style={{ height: "100svh" }}>
      {/* Stats Bar */}
      {isPlaying && (
        <StatsBar
          stats={[
            { label: "Score", value: score, color: "blue" },
            {
              label: "Time",
              value: `${timeLeft}s`,
              color: timeLeft < 30 ? "red" : "white",
            },
            { label: "Words", value: foundWords.size, color: "emerald" },
          ]}
          layout="absolute"
          position="top"
        />
      )}

      {/* Game Board */}
      {board.length > 0 && (
        <div className="flex flex-col items-center gap-6 mt-20">
          <div
            className="relative grid gap-2 p-4 bg-zinc-900 rounded-2xl"
            style={{
              gridTemplateColumns: `repeat(${BOGGLE_CONFIG.GRID_SIZE}, minmax(0, 1fr))`,
              width: "min(90vw, 400px)",
              aspectRatio: "1",
            }}
            onTouchStart={(e) => handleStart(e, e.currentTarget)}
            onTouchMove={(e) => handleMove(e, e.currentTarget)}
            onTouchEnd={handleEnd}
            onMouseDown={(e) => handleStart(e, e.currentTarget)}
            onMouseMove={(e) => {
              if (e.buttons === 1) handleMove(e, e.currentTarget)
            }}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
          >
            {/* Board Cells */}
            {board.map((row, rowIdx) =>
              row.map((letter, colIdx) => {
                const isInCurrentPath = currentPath.some((p) => p.row === rowIdx && p.col === colIdx)
                const pathIndex = currentPath.findIndex((p) => p.row === rowIdx && p.col === colIdx)

                return (
                  <motion.div
                    key={`${rowIdx}-${colIdx}`}
                    className={`
                      flex items-center justify-center
                      text-2xl font-black text-white
                      rounded-lg border-2
                      ${isInCurrentPath ? "bg-blue-500 border-blue-300 scale-110" : "bg-zinc-800 border-zinc-700"}
                      transition-all
                    `}
                    animate={isInCurrentPath ? { scale: 1.1 } : { scale: 1 }}
                  >
                    {letter}
                  </motion.div>
                )
              }),
            )}

            {/* Path SVG Overlay */}
            {currentPath.length > 1 && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                <motion.polyline
                  points={currentPath
                    .map((pos) => {
                      const cellSize = 100 / BOGGLE_CONFIG.GRID_SIZE
                      const x = (pos.col + 0.5) * cellSize
                      const y = (pos.row + 0.5) * cellSize
                      return `${x}%,${y}%`
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Found Words List */}
          <div className="w-full max-w-md">
            <div className="text-sm font-bold text-zinc-400 uppercase mb-2">Found Words ({foundWords.size})</div>
            <div className="bg-zinc-900 rounded-lg p-4 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {Array.from(foundWords).map((word) => (
                  <span key={word} className="text-white font-bold text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            {!isPlaying && (
              <button
                onClick={startGame}
                className="bg-blue-500 hover:bg-blue-600 text-white font-black py-3 px-6 rounded-xl transition-colors"
              >
                Start Game
              </button>
            )}
            {isPlaying && (
              <>
                <button
                  onClick={togglePause}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={handleShowWordsMissed}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Words You Missed
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Start Screen */}
      {!isPlaying && board.length === 0 && (
        <div className="text-center">
          <h2 className="text-4xl font-black text-white mb-4">Boggle</h2>
          <p className="text-zinc-400 mb-8">Find as many words as you can in 3 minutes!</p>
          <button
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && isPlaying && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-10">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-4">Paused</h2>
            <button
              onClick={togglePause}
              className="bg-blue-500 hover:bg-blue-600 text-white font-black py-3 px-6 rounded-xl transition-colors"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        title="Game Over!"
        subtitle={`You found ${foundWords.size} words`}
        score={score}
        scoreLabel="Final Score"
        accentColor="blue"
        onPlayAgain={handleRestart}
        additionalContent={
          showWordsMissed && allWords.size > 0 ? (
            <div className="mt-4 text-left">
              <div className="text-sm font-bold text-zinc-400 uppercase mb-2">
                All Possible Words ({allWords.size})
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {Array.from(allWords)
                    .sort()
                    .map((word) => (
                      <span
                        key={word}
                        className={`text-sm font-bold ${
                          foundWords.has(word) ? "text-emerald-400" : "text-zinc-400"
                        }`}
                      >
                        {word}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ) : null
        }
      />

      {/* Words You Missed Modal */}
      <AnimatePresence>
        {showWordsMissed && !isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20"
            onClick={() => setShowWordsMissed(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-zinc-900 border-2 border-purple-500 rounded-3xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black text-purple-400 mb-4">Words You Missed</h3>
              <div className="bg-zinc-800 rounded-lg p-4 max-h-64 overflow-y-auto mb-4">
                <div className="flex flex-wrap gap-2">
                  {Array.from(allWords)
                    .sort()
                    .map((word) => (
                      <span
                        key={word}
                        className={`text-sm font-bold ${
                          foundWords.has(word) ? "text-emerald-400" : "text-zinc-400"
                        }`}
                      >
                        {word}
                      </span>
                    ))}
                </div>
              </div>
              <button
                onClick={() => setShowWordsMissed(false)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
