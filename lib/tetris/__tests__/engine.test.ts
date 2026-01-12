/**
 * Unit tests for Tetris engine functions
 * Tests core game logic: collision, rotation, line clearing, etc.
 */

import {
  checkCollision,
  rotatePiece,
  attemptWallKick,
  createPiece,
  createEmptyBoard,
  lockPieceToBoard,
  clearLines,
  calculateFallSpeed,
  calculateGhostY,
} from "../engine"
import { DEFAULT_CONFIG } from "../config"
import { CellType } from "../types"

describe("Tetris Engine", () => {
  const config = DEFAULT_CONFIG

  describe("checkCollision", () => {
    it("should detect boundary collisions", () => {
      const piece = createPiece(config)
      const board = createEmptyBoard(config)

      // Move piece to left boundary
      piece.x = -1
      expect(checkCollision(piece, board, 0, 0, config)).toBe(true)

      // Move piece to right boundary
      piece.x = config.boardWidth
      expect(checkCollision(piece, board, 0, 0, config)).toBe(true)

      // Move piece below board
      piece.x = 0
      piece.y = config.boardHeight
      expect(checkCollision(piece, board, 0, 0, config)).toBe(true)
    })

    it("should detect board collisions", () => {
      const piece = createPiece(config)
      const board = createEmptyBoard(config)

      // Place a block on the board
      board[5][5] = CellType.I

      // Try to place piece at same position
      piece.x = 5
      piece.y = 5
      expect(checkCollision(piece, board, 0, 0, config)).toBe(true)
    })

    it("should not detect collision for valid positions", () => {
      const piece = createPiece(config)
      const board = createEmptyBoard(config)

      piece.x = 3
      piece.y = 3
      expect(checkCollision(piece, board, 0, 0, config)).toBe(false)
    })
  })

  describe("rotatePiece", () => {
    it("should rotate piece 90 degrees clockwise", () => {
      const piece = createPiece(config)
      const originalShape = piece.shape.map((row) => [...row])
      const rotated = rotatePiece(piece)

      // Rotation should change the shape
      expect(rotated).not.toEqual(originalShape)
      expect(rotated.length).toBe(originalShape.length)
    })
  })

  describe("createPiece", () => {
    it("should create a valid piece", () => {
      const piece = createPiece(config)

      expect(piece).toHaveProperty("shape")
      expect(piece).toHaveProperty("cellType")
      expect(piece).toHaveProperty("x")
      expect(piece).toHaveProperty("y")
      expect(piece).toHaveProperty("type")
      expect(piece.x).toBeGreaterThanOrEqual(0)
      expect(piece.x).toBeLessThan(config.boardWidth)
    })
  })

  describe("clearLines", () => {
    it("should clear completed lines", () => {
      const board = createEmptyBoard(config)

      // Fill a line
      for (let x = 0; x < config.boardWidth; x++) {
        board[config.boardHeight - 1][x] = CellType.I
      }

      const result = clearLines(board, 1, config)

      expect(result.linesCleared.length).toBe(1)
      expect(result.newBoard[config.boardHeight - 1].every((cell) => cell === null)).toBe(true)
    })

    it("should calculate score correctly", () => {
      const board = createEmptyBoard(config)

      // Fill 2 lines
      for (let y = config.boardHeight - 2; y < config.boardHeight; y++) {
        for (let x = 0; x < config.boardWidth; x++) {
          board[y][x] = CellType.I
        }
      }

      const result = clearLines(board, 2, config)

      expect(result.linesCleared.length).toBe(2)
      expect(result.scoreIncrease).toBe(config.scoring.double * 2)
    })
  })

  describe("calculateFallSpeed", () => {
    it("should decrease speed with level", () => {
      const speed1 = calculateFallSpeed(1, config)
      const speed5 = calculateFallSpeed(5, config)

      expect(speed5).toBeLessThan(speed1)
    })

    it("should not go below minimum speed", () => {
      const speed100 = calculateFallSpeed(100, config)

      expect(speed100).toBeGreaterThanOrEqual(config.minFallSpeed)
    })
  })

  describe("calculateGhostY", () => {
    it("should calculate correct ghost position", () => {
      const piece = createPiece(config)
      const board = createEmptyBoard(config)

      piece.y = 0
      const ghostY = calculateGhostY(piece, board, config)

      expect(ghostY).toBeGreaterThanOrEqual(piece.y)
      expect(ghostY).toBeLessThanOrEqual(config.boardHeight)
    })
  })
})
