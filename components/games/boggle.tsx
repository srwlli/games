"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar, GameOverModal, StartScreen, CountdownOverlay } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useCountdown } from "@/hooks/use-countdown"
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"
import { DictionaryService } from "@/lib/word-games/trie/trie-service"
import { generateBoard, calculateBoggleScore, validateWord, solveBoard, BOGGLE_DICE } from "@/lib/word-games/boggle/engine"
import { BOGGLE_CONFIG, TIME_MODES, type TimeMode } from "@/lib/word-games/boggle/config"
import type { BogglePath, BogglePosition } from "@/lib/word-games/boggle/types"

export default function Boggle() {
  const { isPlaying, isPaused, isGameOver, pause, resume, gameOver, reset, start } = useGameState({
    initialState: "idle",
  })
  const { updateScore, endGameSession } = useGameSessionIntegration("boggle")

  // Time mode selection
  const [timeMode, setTimeMode] = useState<TimeMode>("3min")
  const timeLimit = TIME_MODES[timeMode]

  const [board, setBoard] = useState<string[][]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [currentPath, setCurrentPath] = useState<BogglePath>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWordsMissed, setShowWordsMissed] = useState(false)
  const [allWords, setAllWords] = useState<Set<string>>(new Set())
  const [acceptedPath, setAcceptedPath] = useState<BogglePath | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownStartedRef = useRef(false)

  const touchStartRef = useRef<{ row: number; col: number } | null>(null)
  const isDrawingRef = useRef(false)
  const lastMoveTimeRef = useRef(0)
  const lastCellRef = useRef<BogglePosition | null>(null)
  const hoveredCellRef = useRef<BogglePosition | null>(null)
  const [hoveredCell, setHoveredCell] = useState<BogglePosition | null>(null)
  const tapStartTimeRef = useRef(0)
  const tapStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null)
  const movementVectorRef = useRef<{ dx: number; dy: number } | null>(null)
  const committedDirectionRef = useRef<{ row: number; col: number } | null>(null)
  const cellEnterTimeRef = useRef<Map<string, number>>(new Map())

  const { timeLeft, reset: resetTimer } = useCountdown(
    timeLimit,
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
    resetTimer(timeLimit) // Reset with selected time mode
    start()
    // Start countdown
    countdownStartedRef.current = true
    setCountdown(3)
  }, [start, resetTimer, timeLimit])

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

  // Handle game over
  const handleGameOver = useCallback(() => {
    gameOver()
    endGameSession(score, {
      wordsFound: foundWords.size,
      totalWords: allWords.size,
    })
  }, [gameOver, score, foundWords.size, allWords.size, endGameSession])

  // Get cell position from touch/click coordinates with improved sensitivity
  // Implements movement threshold and directional awareness to prevent corner catches
  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number, container: HTMLElement, considerMovement: boolean = false): BogglePosition | null => {
      const rect = container.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      const cellSize = rect.width / BOGGLE_CONFIG.GRID_SIZE
      
      // Calculate which cell we're in
      const col = Math.floor(x / cellSize)
      const row = Math.floor(y / cellSize)

      // Check bounds
      if (row < 0 || row >= BOGGLE_CONFIG.GRID_SIZE || col < 0 || col >= BOGGLE_CONFIG.GRID_SIZE) {
        return null
      }

      // Calculate position within cell (0-1 range)
      const cellX = (x % cellSize) / cellSize
      const cellY = (y % cellSize) / cellSize
      
      // Use a very large center zone (85% of cell) - extremely forgiving
      const centerThreshold = 0.075 // 7.5% margin = 85% center area
      const isInCenter = 
        cellX >= centerThreshold && cellX <= (1 - centerThreshold) &&
        cellY >= centerThreshold && cellY <= (1 - centerThreshold)

      // If in center area, return immediately
      if (isInCenter) {
        return { row, col }
      }

      // For edge/corner areas, use movement-aware detection
      // This prevents corner catches by requiring significant movement
      const currentCell = { row, col }
      const currentDistanceToCenter = Math.sqrt(
        Math.pow(cellX - 0.5, 2) + Math.pow(cellY - 0.5, 2)
      )

      // If we have movement data, use it to bias diagonal detection
      if (considerMovement && movementVectorRef.current && lastCellRef.current) {
        const { dx, dy } = movementVectorRef.current
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        
        // If movement is clearly diagonal (both dx and dy significant), prefer diagonal cells
        const isDiagonalMovement = absDx > 5 && absDy > 5 && Math.abs(absDx - absDy) < absDx * 0.5
        
        if (isDiagonalMovement) {
          // For diagonal movement, check diagonal neighbors first
          const diagonalDirs = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
          ]
          
          for (const { dr, dc } of diagonalDirs) {
            const nr = row + dr
            const nc = col + dc
            
            if (nr >= 0 && nr < BOGGLE_CONFIG.GRID_SIZE && nc >= 0 && nc < BOGGLE_CONFIG.GRID_SIZE) {
              let adjCellX = cellX - dc
              let adjCellY = cellY - dr
              
              if (adjCellX < 0) adjCellX += 1
              if (adjCellX > 1) adjCellX -= 1
              if (adjCellY < 0) adjCellY += 1
              if (adjCellY > 1) adjCellY -= 1
              
              const distanceToAdjCenter = Math.sqrt(
                Math.pow(adjCellX - 0.5, 2) + Math.pow(adjCellY - 0.5, 2)
              )
              
              // More lenient threshold for diagonal movement
              if (distanceToAdjCenter < currentDistanceToCenter - 0.15) {
                return { row: nr, col: nc }
              }
            }
          }
        }
      }

      // Standard adjacent cell detection with higher threshold
      let bestCell: BogglePosition | null = null
      let bestDistance = Infinity
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          
          const nr = row + dr
          const nc = col + dc
          
          if (nr >= 0 && nr < BOGGLE_CONFIG.GRID_SIZE && nc >= 0 && nc < BOGGLE_CONFIG.GRID_SIZE) {
            let adjCellX = cellX - dc
            let adjCellY = cellY - dr
            
            if (adjCellX < 0) adjCellX += 1
            if (adjCellX > 1) adjCellX -= 1
            if (adjCellY < 0) adjCellY += 1
            if (adjCellY > 1) adjCellY -= 1
            
            const distanceToAdjCenter = Math.sqrt(
              Math.pow(adjCellX - 0.5, 2) + Math.pow(adjCellY - 0.5, 2)
            )
            
            // Higher threshold (0.25) to prevent corner catches
            // Only switch if significantly closer to adjacent cell center
            if (distanceToAdjCenter < bestDistance && 
                distanceToAdjCenter < currentDistanceToCenter - 0.25) {
              bestDistance = distanceToAdjCenter
              bestCell = { row: nr, col: nc }
            }
          }
        }
      }

      // If we found a better adjacent cell, use it
      // Otherwise, stick with current cell (prevents accidental corner catches)
      return bestCell || currentCell
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

      // Record tap start for tap detection
      tapStartTimeRef.current = Date.now()
      tapStartPosRef.current = { x: clientX, y: clientY }
      lastPointerPosRef.current = { x: clientX, y: clientY }
      movementVectorRef.current = null
      committedDirectionRef.current = null
      cellEnterTimeRef.current.clear()

      const cell = getCellFromPoint(clientX, clientY, container, false)
      if (cell) {
        touchStartRef.current = cell
        isDrawingRef.current = true
        lastCellRef.current = cell
        committedDirectionRef.current = cell
        cellEnterTimeRef.current.set(`${cell.row},${cell.col}`, Date.now())
        setCurrentPath([cell])
        setHoveredCell(cell)
        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(10)
        }
      }
    },
    [isPlaying, isPaused, board, getCellFromPoint],
  )

  // Handle touch/click move with throttling and improved cell detection
  // Implements "commitment" mechanism: only selects cells when intentionally entered, not just passed over
  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent, container: HTMLElement) => {
      if (!isDrawingRef.current || !touchStartRef.current || !isPlaying || isPaused) return

      // Throttle move events to improve performance
      const now = Date.now()
      if (now - lastMoveTimeRef.current < 16) return // ~60fps
      lastMoveTimeRef.current = now

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      // Calculate movement vector for directional awareness
      if (lastPointerPosRef.current) {
        const dx = clientX - lastPointerPosRef.current.x
        const dy = clientY - lastPointerPosRef.current.y
        movementVectorRef.current = { dx, dy }
      }
      lastPointerPosRef.current = { x: clientX, y: clientY }

      // Get cell with movement awareness
      const detectedCell = getCellFromPoint(clientX, clientY, container, true)
      if (!detectedCell) return

      // CRITICAL: Only allow switching to cells adjacent to the last cell in path
      // This prevents corner catches when moving diagonally
      let cell = detectedCell
      if (currentPath.length > 0) {
        const lastCell = currentPath[currentPath.length - 1]
        
        // If detected cell is not adjacent to last cell, ignore it
        // This prevents accidental jumps to non-adjacent cells at corners
        if (!isAdjacent(lastCell, detectedCell)) {
          // Don't update - stay in current path
          return
        }

        // COMMITMENT MECHANISM: Only select cells when user has "committed" to entering them
        // This prevents selecting cells that are just passed over during diagonal movement
        const cellKey = `${cell.row},${cell.col}`
        const currentTime = Date.now()
        
        // Track when we first entered this cell
        if (!cellEnterTimeRef.current.has(cellKey)) {
          cellEnterTimeRef.current.set(cellKey, currentTime)
        }
        
        const enterTime = cellEnterTimeRef.current.get(cellKey)!
        const timeInCell = currentTime - enterTime
        
        // Require minimum time in cell OR significant movement into cell before committing
        const rect = container.getBoundingClientRect()
        const cellSize = rect.width / BOGGLE_CONFIG.GRID_SIZE
        
        // Calculate how far into the cell we are (0-1, where 0.5 is center)
        const cellX = ((clientX - rect.left) % cellSize) / cellSize
        const cellY = ((clientY - rect.top) % cellSize) / cellSize
        const distanceFromEdge = Math.min(
          Math.min(cellX, 1 - cellX),
          Math.min(cellY, 1 - cellY)
        )
        
        // Require either:
        // 1. Been in cell for at least 50ms (prevents quick pass-overs)
        // 2. Moved significantly into cell center (at least 30% from edge)
        // 3. This is a backtrack (already in path)
        const isBacktrack = isInPath(currentPath, cell)
        const isCommitted = timeInCell >= 50 || distanceFromEdge >= 0.3 || isBacktrack
        
        // If we have a committed direction and this cell matches it, allow it
        if (committedDirectionRef.current) {
          const committed = committedDirectionRef.current
          const rowDiff = cell.row - lastCell.row
          const colDiff = cell.col - lastCell.col
          const committedRowDiff = committed.row - lastCell.row
          const committedColDiff = committed.col - lastCell.col
          
          // If moving in committed direction, allow it
          if (rowDiff === committedRowDiff && colDiff === committedColDiff) {
            // Allow committed direction
          } else {
            // Not moving in committed direction - require commitment to new direction
            if (!isCommitted) {
              return // Don't switch yet
            }
            // Update committed direction
            committedDirectionRef.current = cell
          }
        } else {
          // No committed direction yet - require commitment before allowing
          if (!isCommitted) {
            // Set potential direction but don't commit yet
            if (!committedDirectionRef.current) {
              committedDirectionRef.current = cell
            }
            return // Don't add to path yet
          }
          // Commit to this direction
          committedDirectionRef.current = cell
        }
        
        // Clear enter time for cells we're leaving
        cellEnterTimeRef.current.forEach((time, key) => {
          if (key !== cellKey) {
            cellEnterTimeRef.current.delete(key)
          }
        })
      } else {
        // Starting new path - commit immediately
        committedDirectionRef.current = cell
        cellEnterTimeRef.current.clear()
        cellEnterTimeRef.current.set(`${cell.row},${cell.col}`, Date.now())
      }

      // Update hovered cell for visual feedback
      if (hoveredCellRef.current?.row !== cell.row || hoveredCellRef.current?.col !== cell.col) {
        hoveredCellRef.current = cell
        setHoveredCell(cell)
      }

      // Only process if cell changed
      if (lastCellRef.current?.row !== cell.row || lastCellRef.current?.col !== cell.col) {
        lastCellRef.current = cell
        
        setCurrentPath((prev) => {
          if (prev.length === 0) {
            return [cell]
          }

          if (isInPath(prev, cell)) {
            // Allow backtracking - remove from path
            const index = prev.findIndex((p) => p.row === cell.row && p.col === cell.col)
            if (index >= 0 && index < prev.length - 1) {
              // Reset committed direction on backtrack
              committedDirectionRef.current = null
              cellEnterTimeRef.current.clear()
              return prev.slice(0, index + 1)
            }
          } else if (isAdjacent(prev[prev.length - 1], cell)) {
            // Add to path if adjacent (should always be true due to check above, but double-check)
            return [...prev, cell]
          }
          return prev
        })
      }
    },
    [isPlaying, isPaused, getCellFromPoint, isAdjacent, isInPath, currentPath],
  )

  // Handle touch/click end
  const handleEnd = useCallback(() => {
    // Check if this was a tap (quick touch without significant movement)
    const tapDuration = Date.now() - tapStartTimeRef.current
    const wasTap = tapDuration < 200 && tapStartPosRef.current
    
    if (wasTap && touchStartRef.current) {
      // Handle tap: add cell to path if adjacent, or start new path
      const tappedCell = touchStartRef.current
      setCurrentPath((prev) => {
        if (prev.length === 0) {
          // Start new path
          return [tappedCell]
        } else if (isAdjacent(prev[prev.length - 1], tappedCell)) {
          // Add to existing path if adjacent
          if (!isInPath(prev, tappedCell)) {
            return [...prev, tappedCell]
          }
        } else if (isInPath(prev, tappedCell)) {
          // Allow backtracking on tap
          const index = prev.findIndex((p) => p.row === tappedCell.row && p.col === tappedCell.col)
          if (index >= 0 && index < prev.length - 1) {
            return prev.slice(0, index + 1)
          }
        }
        return prev
      })
      
      // Haptic feedback for tap
      if ("vibrate" in navigator) {
        navigator.vibrate(10)
      }
    }

    if (!isDrawingRef.current || currentPath.length === 0) {
      setCurrentPath([])
      setHoveredCell(null)
      hoveredCellRef.current = null
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
        // Update score - let useEffect handle session update to avoid render-time state updates
        setScore((prev) => prev + wordScore)
        // Haptic feedback for valid word
        if ("vibrate" in navigator) {
          navigator.vibrate(20)
        }
        // Show acceptance feedback: flash path green/emerald
        setAcceptedPath([...currentPath])
        // Clear accepted path after animation (300ms)
        setTimeout(() => {
          setAcceptedPath(null)
        }, 300)
      }
    }

    setCurrentPath([])
    setHoveredCell(null)
    hoveredCellRef.current = null
    isDrawingRef.current = false
    touchStartRef.current = null
    lastCellRef.current = null
    lastPointerPosRef.current = null
    movementVectorRef.current = null
    committedDirectionRef.current = null
    cellEnterTimeRef.current.clear()
  }, [currentPath, board, foundWords, updateScore, isAdjacent, isInPath])

  // Solve board for "Words You Missed"
  const handleShowWordsMissed = useCallback(() => {
    if (board.length === 0) return
    const solved = solveBoard(board)
    setAllWords(solved)
    setShowWordsMissed(true)
  }, [board])

  // Update score in session (wrapped in useEffect to avoid render-time updates)
  useEffect(() => {
    if (isPlaying) {
      updateScore(score)
    }
  }, [score, updateScore, isPlaying])

  // Handle reset
  const handleReset = useCallback(() => {
    reset()
    setBoard([])
    setFoundWords(new Set())
    setScore(0)
    setCurrentPath([])
    setShowWordsMissed(false)
    setAllWords(new Set())
    setAcceptedPath(null)
    setCountdown(null)
    countdownStartedRef.current = false
    // Do not auto-start - user must click "Start Game" again
  }, [reset])

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
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center bg-black touch-none" 
      style={{ 
        height: "100svh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
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
            className="relative grid gap-2 p-4 bg-zinc-900 rounded-2xl select-none"
            style={{
              gridTemplateColumns: `repeat(${BOGGLE_CONFIG.GRID_SIZE}, minmax(0, 1fr))`,
              width: "min(90vw, 400px)",
              aspectRatio: "1",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              handleStart(e, e.currentTarget)
            }}
            onTouchMove={(e) => {
              e.preventDefault()
              handleMove(e, e.currentTarget)
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handleEnd()
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              handleStart(e, e.currentTarget)
            }}
            onMouseMove={(e) => {
              e.preventDefault()
              if (e.buttons === 1) handleMove(e, e.currentTarget)
            }}
            onMouseUp={(e) => {
              e.preventDefault()
              handleEnd()
            }}
            onMouseLeave={(e) => {
              e.preventDefault()
              handleEnd()
            }}
            onDragStart={(e) => {
              e.preventDefault()
            }}
          >
            {/* Board Cells */}
            {board.map((row, rowIdx) =>
              row.map((letter, colIdx) => {
                const isInCurrentPath = currentPath.some((p) => p.row === rowIdx && p.col === colIdx)
                const pathIndex = currentPath.findIndex((p) => p.row === rowIdx && p.col === colIdx)
                const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx && !isInCurrentPath
                const isLastInPath = pathIndex === currentPath.length - 1
                const isAccepted = acceptedPath?.some((p) => p.row === rowIdx && p.col === colIdx) ?? false

                return (
                  <motion.div
                    key={`${rowIdx}-${colIdx}`}
                    className={`
                      flex items-center justify-center
                      text-2xl font-black text-white
                      rounded-lg border-2 cursor-pointer
                      ${isAccepted
                        ? "bg-emerald-500 border-emerald-300"
                        : isInCurrentPath 
                        ? "bg-blue-500 border-blue-300" 
                        : isHovered 
                        ? "bg-blue-500/30 border-blue-400/50" 
                        : "bg-zinc-800 border-zinc-700"}
                      transition-all
                    `}
                    animate={
                      isAccepted 
                        ? { scale: [1, 1.15, 1.1] } 
                        : isInCurrentPath 
                        ? { scale: 1.1 } 
                        : isHovered 
                        ? { scale: 1.05 } 
                        : { scale: 1 }
                    }
                    transition={isAccepted ? { duration: 0.3 } : {}}
                    onClick={(e) => {
                      // Handle individual cell click
                      e.stopPropagation()
                      if (!isPlaying || isPaused) return
                      
                      const clickedCell = { row: rowIdx, col: colIdx }
                      setCurrentPath((prev) => {
                        if (prev.length === 0) {
                          // Start new path
                          return [clickedCell]
                        } else if (isAdjacent(prev[prev.length - 1], clickedCell)) {
                          // Add to existing path if adjacent
                          if (!isInPath(prev, clickedCell)) {
                            return [...prev, clickedCell]
                          }
                        } else if (isInPath(prev, clickedCell)) {
                          // Allow backtracking on click
                          const index = prev.findIndex((p) => p.row === rowIdx && p.col === colIdx)
                          if (index >= 0 && index < prev.length - 1) {
                            return prev.slice(0, index + 1)
                          }
                        }
                        return prev
                      })
                      
                      // Haptic feedback
                      if ("vibrate" in navigator) {
                        navigator.vibrate(10)
                      }
                    }}
                  >
                    {letter}
                  </motion.div>
                )
              }),
            )}

            {/* Path SVG Overlay */}
            {((currentPath.length > 1) || (acceptedPath && acceptedPath.length > 1)) && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Accepted path (green/emerald) */}
                {acceptedPath && acceptedPath.length > 1 && (
                  <motion.polyline
                    points={acceptedPath
                      .map((pos) => {
                        const cellSize = 100 / BOGGLE_CONFIG.GRID_SIZE
                        const x = (pos.col + 0.5) * cellSize
                        const y = (pos.row + 0.5) * cellSize
                        return `${x},${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                {/* Current path (blue) */}
                {currentPath.length > 1 && !acceptedPath && (
                  <motion.polyline
                    points={currentPath
                      .map((pos) => {
                        const cellSize = 100 / BOGGLE_CONFIG.GRID_SIZE
                        const x = (pos.col + 0.5) * cellSize
                        const y = (pos.row + 0.5) * cellSize
                        return `${x},${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
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
      {!isPlaying && !isGameOver && (
        <StartScreen
          title="Boggle"
          description="Find as many words as you can!"
          onStart={startGame}
          accentColor="blue"
          controls={["Drag or tap letters to form words", "P to pause"]}
        >
          {/* Time Mode Selection */}
          <div className="mb-4">
            <label className="block text-white font-bold mb-3 text-sm uppercase tracking-wider">Select Time:</label>
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(TIME_MODES).map(([mode, seconds]) => (
                <button
                  key={mode}
                  onClick={() => setTimeMode(mode as TimeMode)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                    timeMode === mode
                      ? "bg-blue-500 text-white scale-110"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>
        </StartScreen>
      )}

      {/* Countdown Overlay */}
      <CountdownOverlay count={countdown} accentColor="blue" />

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
        onPlayAgain={handleReset}
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
