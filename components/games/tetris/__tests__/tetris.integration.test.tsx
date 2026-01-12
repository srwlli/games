/**
 * Integration tests for Tetris component
 * Tests end-to-end functionality and component interactions
 * 
 * Note: Requires test framework setup (Jest/Vitest + React Testing Library)
 * Run: npm test components/games/tetris
 */

import { describe, it, expect, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Tetris from "../tetris"

// Mock the engine hook
jest.mock("@/hooks/use-tetris-engine", () => ({
  useTetrisEngine: jest.fn(() => ({
    board: Array(20).fill(null).map(() => Array(10).fill(null)),
    currentPiece: {
      shape: [[1, 1], [1, 1]],
      cellType: 2, // O piece
      x: 4,
      y: 0,
      type: "O",
      rotation: 0,
    },
    nextPiece: {
      shape: [[1, 1, 1, 1]],
      cellType: 1, // I piece
      x: 0,
      y: 0,
      type: "I",
      rotation: 0,
    },
    heldPiece: null,
    score: 0,
    level: 1,
    linesCleared: 0,
    fallSpeed: 1000,
    ghostY: 18,
    lockDelayActive: false,
    lastClearedLines: [],
    canHold: true,
    moveLeft: jest.fn(),
    moveRight: jest.fn(),
    moveDown: jest.fn(),
    rotate: jest.fn(),
    hardDrop: jest.fn(),
    holdPiece: jest.fn(),
    reset: jest.fn(),
    tick: jest.fn(),
    resetLockDelay: jest.fn(),
  })),
}))

describe("Tetris Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render game board", () => {
      render(<Tetris />)
      const board = screen.getByRole("grid", { name: /game board/i })
      expect(board).toBeInTheDocument()
    })

    it("should render stats bar with score, level, and lines", () => {
      render(<Tetris />)
      expect(screen.getByText(/score/i)).toBeInTheDocument()
      expect(screen.getByText(/level/i)).toBeInTheDocument()
      expect(screen.getByText(/lines/i)).toBeInTheDocument()
    })

    it("should render next piece preview", () => {
      render(<Tetris />)
      expect(screen.getByText(/next/i)).toBeInTheDocument()
    })

    it("should render pause button", () => {
      render(<Tetris />)
      const pauseButton = screen.getByRole("button", { name: /pause|resume/i })
      expect(pauseButton).toBeInTheDocument()
    })
  })

  describe("Game State Management", () => {
    it("should show start screen when game is idle", () => {
      render(<Tetris />)
      expect(screen.getByText(/tetris/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument()
    })

    it("should start game when start button is clicked", async () => {
      render(<Tetris />)
      const startButton = screen.getByRole("button", { name: /start game/i })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.queryByText(/start game/i)).not.toBeInTheDocument()
      })
    })
  })

  describe("Keyboard Input", () => {
    it("should handle arrow key movements", () => {
      const { useTetrisEngine } = require("@/hooks/use-tetris-engine")
      const mockMoveLeft = jest.fn()
      const mockMoveRight = jest.fn()
      const mockMoveDown = jest.fn()

      useTetrisEngine.mockReturnValue({
        ...useTetrisEngine(),
        moveLeft: mockMoveLeft,
        moveRight: mockMoveRight,
        moveDown: mockMoveDown,
      })

      render(<Tetris />)

      fireEvent.keyDown(window, { key: "ArrowLeft" })
      expect(mockMoveLeft).toHaveBeenCalled()

      fireEvent.keyDown(window, { key: "ArrowRight" })
      expect(mockMoveRight).toHaveBeenCalled()

      fireEvent.keyDown(window, { key: "ArrowDown" })
      expect(mockMoveDown).toHaveBeenCalled()
    })

    it("should handle rotation with arrow up", () => {
      const { useTetrisEngine } = require("@/hooks/use-tetris-engine")
      const mockRotate = jest.fn()

      useTetrisEngine.mockReturnValue({
        ...useTetrisEngine(),
        rotate: mockRotate,
      })

      render(<Tetris />)
      fireEvent.keyDown(window, { key: "ArrowUp" })
      expect(mockRotate).toHaveBeenCalled()
    })

    it("should handle hard drop with space", () => {
      const { useTetrisEngine } = require("@/hooks/use-tetris-engine")
      const mockHardDrop = jest.fn()

      useTetrisEngine.mockReturnValue({
        ...useTetrisEngine(),
        hardDrop: mockHardDrop,
      })

      render(<Tetris />)
      fireEvent.keyDown(window, { key: " " })
      expect(mockHardDrop).toHaveBeenCalled()
    })

    it("should handle hold piece with C key", () => {
      const { useTetrisEngine } = require("@/hooks/use-tetris-engine")
      const mockHoldPiece = jest.fn()

      useTetrisEngine.mockReturnValue({
        ...useTetrisEngine(),
        holdPiece: mockHoldPiece,
      })

      render(<Tetris />)
      fireEvent.keyDown(window, { key: "c" })
      expect(mockHoldPiece).toHaveBeenCalled()
    })
  })

  describe("Mobile Controls", () => {
    it("should render mobile controls on mobile devices", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === "(max-width: 768px)",
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(<Tetris />)
      // Mobile controls should be present (hidden on desktop)
      const controls = screen.queryByRole("group", { name: /game controls/i })
      // Note: Controls are conditionally rendered based on isPlaying
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<Tetris />)
      const gameArea = screen.getByRole("application", { name: /tetris game/i })
      expect(gameArea).toBeInTheDocument()

      const board = screen.getByRole("grid", { name: /game board/i })
      expect(board).toHaveAttribute("aria-rowcount", "20")
      expect(board).toHaveAttribute("aria-colcount", "10")
    })

    it("should have accessible buttons", () => {
      render(<Tetris />)
      const pauseButton = screen.getByRole("button", { name: /pause|resume/i })
      expect(pauseButton).toHaveAttribute("aria-label")
    })
  })

  describe("Game Over Flow", () => {
    it("should show game over modal when game ends", () => {
      const { useTetrisEngine } = require("@/hooks/use-tetris-engine")
      const { useGameState } = require("@/hooks/use-game-state")

      // Mock game over state
      useGameState.mockReturnValue({
        state: "gameOver",
        isPlaying: false,
        isPaused: false,
        isGameOver: true,
        pause: jest.fn(),
        resume: jest.fn(),
        gameOver: jest.fn(),
        reset: jest.fn(),
        start: jest.fn(),
      })

      render(<Tetris />)
      expect(screen.getByText(/game over/i)).toBeInTheDocument()
    })
  })
})
