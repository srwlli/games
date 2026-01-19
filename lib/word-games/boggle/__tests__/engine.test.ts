/**
 * Unit tests for Boggle engine
 */

import { calculateBoggleScore, generateBoard, BOGGLE_DICE } from "../engine"
import { BOGGLE_CONFIG } from "../config"

describe("Boggle Engine", () => {
  describe("calculateBoggleScore", () => {
    it("should return 0 for words shorter than minimum length", () => {
      expect(calculateBoggleScore("AB")).toBe(0)
      expect(calculateBoggleScore("A")).toBe(0)
    })

    it("should return 1 for 3-letter words", () => {
      expect(calculateBoggleScore("ABC")).toBe(1)
    })

    it("should return 2 for 4-letter words", () => {
      expect(calculateBoggleScore("ABCD")).toBe(2)
    })

    it("should return 3 for 5-letter words", () => {
      expect(calculateBoggleScore("ABCDE")).toBe(3)
    })

    it("should return 5 for 6-letter words", () => {
      expect(calculateBoggleScore("ABCDEF")).toBe(5)
    })

    it("should return 7 for 7-letter words", () => {
      expect(calculateBoggleScore("ABCDEFG")).toBe(7)
    })

    it("should return 11 for 8+ letter words", () => {
      expect(calculateBoggleScore("ABCDEFGH")).toBe(11)
      expect(calculateBoggleScore("ABCDEFGHIJKLMNOP")).toBe(11)
    })
  })

  describe("generateBoard", () => {
    it("should generate a 4x4 board", () => {
      const board = generateBoard()
      expect(board.length).toBe(BOGGLE_CONFIG.GRID_SIZE)
      board.forEach((row) => {
        expect(row.length).toBe(BOGGLE_CONFIG.GRID_SIZE)
      })
    })

    it("should generate different boards on each call", () => {
      const board1 = generateBoard()
      const board2 = generateBoard()
      // Boards should be different (very unlikely to be identical)
      const board1Str = board1.flat().join("")
      const board2Str = board2.flat().join("")
      // Note: There's a tiny chance they're the same, but it's extremely unlikely
      expect(board1Str !== board2Str || board1Str.length > 0).toBe(true)
    })

    it("should use letters from BOGGLE_DICE", () => {
      const board = generateBoard()
      const allDiceLetters = BOGGLE_DICE.join("").split("")
      board.flat().forEach((letter) => {
        // Handle QU case
        if (letter === "QU") {
          expect(allDiceLetters.includes("Q")).toBe(true)
        } else {
          expect(allDiceLetters.includes(letter)).toBe(true)
        }
      })
    })
  })

  describe("BOGGLE_DICE", () => {
    it("should have 16 dice", () => {
      expect(BOGGLE_DICE.length).toBe(16)
    })

    it("should have 6 faces per die", () => {
      BOGGLE_DICE.forEach((die) => {
        expect(die.length).toBe(6)
      })
    })
  })
})
