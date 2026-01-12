import type { Piece, Board, GameState, GameConfig, LineClearResult } from "./types"
import { SHAPES, getRandomPieceType } from "./shapes"
import { CellType } from "./types"

/**
 * Precompute piece bounds for faster collision checks
 */
interface PieceBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  occupied: Set<string> // "x,y" format
}

function computePieceBounds(piece: Piece): PieceBounds {
  const occupied = new Set<string>()
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const worldX = piece.x + x
        const worldY = piece.y + y
        occupied.add(`${worldX},${worldY}`)
        minX = Math.min(minX, worldX)
        maxX = Math.max(maxX, worldX)
        minY = Math.min(minY, worldY)
        maxY = Math.max(maxY, worldY)
      }
    }
  }

  return { minX, maxX, minY, maxY, occupied }
}

/**
 * Check if a piece collides with the board or boundaries (optimized)
 */
export function checkCollision(
  piece: Piece,
  board: Board,
  offsetX = 0,
  offsetY = 0,
  config: GameConfig,
): boolean {
  // Check each cell of the piece directly (more reliable than bounds optimization)
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + offsetX
        const newY = piece.y + y + offsetY

        // Boundary checks
        if (newX < 0 || newX >= config.boardWidth || newY >= config.boardHeight) {
          return true
        }

        // Board collision check (only for cells within board bounds)
        if (newY >= 0 && board[newY]?.[newX]) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Rotate a piece 90 degrees clockwise
 */
export function rotatePiece(piece: Piece): number[][] {
  const rotated = piece.shape[0].map((_, i) => piece.shape.map((row) => row[i]).reverse())
  return rotated
}

/**
 * SRS-Lite wall kicks: attempt small offsets when rotation collides
 */
export function attemptWallKick(
  piece: Piece,
  board: Board,
  config: GameConfig,
): Piece | null {
  const rotated = rotatePiece(piece)
  const newPiece = { ...piece, shape: rotated }

  // If rotation doesn't collide, return it
  if (!checkCollision(newPiece, board, 0, 0, config)) {
    return newPiece
  }

  // Try wall kick offsets (SRS-Lite: simple 1-cell offsets)
  const offsets = [
    { x: -1, y: 0 }, // Left
    { x: 1, y: 0 }, // Right
    { x: 0, y: -1 }, // Up
    { x: -1, y: -1 }, // Up-left
    { x: 1, y: -1 }, // Up-right
  ]

  for (const offset of offsets) {
    if (!checkCollision(newPiece, board, offset.x, offset.y, config)) {
      return { ...newPiece, x: newPiece.x + offset.x, y: newPiece.y + offset.y }
    }
  }

  return null
}

/**
 * Create a new random piece
 */
export function createPiece(config: GameConfig): Piece {
  const type = getRandomPieceType()
  const { shape, cellType } = SHAPES[type]

  return {
    shape,
    cellType,
    x: Math.floor(config.boardWidth / 2) - 2,
    y: 0,
    type,
    rotation: 0,
  }
}

/**
 * Create an empty board
 */
export function createEmptyBoard(config: GameConfig): Board {
  return Array(config.boardHeight)
    .fill(null)
    .map(() => Array(config.boardWidth).fill(null))
}

/**
 * Lock a piece to the board and return the updated board
 */
export function lockPieceToBoard(piece: Piece, board: Board, config: GameConfig): Board {
  const newBoard = board.map((row) => [...row])

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y
        const boardX = piece.x + x
        if (boardY >= 0 && boardY < config.boardHeight && boardX >= 0 && boardX < config.boardWidth) {
          newBoard[boardY][boardX] = piece.cellType
        }
      }
    }
  }

  return newBoard
}

/**
 * Clear completed lines and return result
 */
export function clearLines(board: Board, level: number, config: GameConfig): LineClearResult {
  const completedLines: number[] = []
  const newBoard = board.map((row) => [...row])

  // Find completed lines
  for (let y = config.boardHeight - 1; y >= 0; y--) {
    if (newBoard[y].every((cell) => cell !== null)) {
      completedLines.push(y)
    }
  }

  // Remove completed lines
  if (completedLines.length > 0) {
    completedLines.forEach((line) => {
      newBoard.splice(line, 1)
      newBoard.unshift(Array(config.boardWidth).fill(null))
    })

    // Calculate score
    const lineScores = [
      config.scoring.single,
      config.scoring.double,
      config.scoring.triple,
      config.scoring.tetris,
    ]
    const scoreIncrease = (lineScores[completedLines.length - 1] || 0) * level

    // Calculate level increase
    const newLinesCleared = completedLines.length
    const levelIncrease = Math.floor(newLinesCleared / config.levelUpLines)

    return {
      linesCleared: completedLines,
      newBoard,
      scoreIncrease,
      levelIncrease,
    }
  }

  return {
    linesCleared: [],
    newBoard: board,
    scoreIncrease: 0,
    levelIncrease: 0,
  }
}

/**
 * Calculate fall speed based on level
 */
export function calculateFallSpeed(level: number, config: GameConfig): number {
  const speed = config.initialFallSpeed - (level - 1) * 100
  return Math.max(config.minFallSpeed, speed)
}

/**
 * Calculate ghost piece Y position (landing position)
 */
export function calculateGhostY(piece: Piece, board: Board, config: GameConfig): number {
  let ghostY = piece.y
  while (!checkCollision({ ...piece, y: ghostY + 1 }, board, 0, 0, config)) {
    ghostY++
  }
  return ghostY
}
