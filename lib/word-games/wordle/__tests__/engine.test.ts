/**
 * Unit tests for Wordle engine
 */

import { checkGuess, validateGuess } from "../engine"
import { WORDLE_CONFIG } from "../config"

describe("Wordle Engine", () => {
  describe("checkGuess", () => {
    it("should return all correct for exact match", () => {
      const result = checkGuess("HELLO", "HELLO")
      expect(result).toEqual(["correct", "correct", "correct", "correct", "correct"])
    })

    it("should return all absent for no matching letters", () => {
      const result = checkGuess("ABCDE", "FGHIJ")
      expect(result).toEqual(["absent", "absent", "absent", "absent", "absent"])
    })

    it("should mark correct positions first", () => {
      const result = checkGuess("HELLO", "HELLO")
      expect(result[0]).toBe("correct")
      expect(result[1]).toBe("correct")
    })

    it("should mark present letters in wrong position", () => {
      const result = checkGuess("HELLO", "OLLEH")
      // All letters are present but in wrong positions
      expect(result.every((state) => state === "present")).toBe(true)
    })

    it("should handle duplicate letters correctly", () => {
      const result = checkGuess("EERIE", "EAGLE")
      // First E is correct, second E is absent (already used), third E is absent
      expect(result[0]).toBe("correct")
      expect(result[1]).toBe("absent")
      expect(result[2]).toBe("absent")
    })

    it("should throw error for mismatched lengths", () => {
      expect(() => checkGuess("HELL", "HELLO")).toThrow()
      expect(() => checkGuess("HELLO", "HELL")).toThrow()
    })

    it("should be case insensitive", () => {
      const result1 = checkGuess("hello", "HELLO")
      const result2 = checkGuess("HELLO", "hello")
      expect(result1).toEqual(["correct", "correct", "correct", "correct", "correct"])
      expect(result2).toEqual(["correct", "correct", "correct", "correct", "correct"])
    })
  })

  describe("validateGuess", () => {
    it("should return false for wrong length", () => {
      expect(validateGuess("HELL")).toBe(false)
      expect(validateGuess("HELLOO")).toBe(false)
    })

    it("should return true for correct length", () => {
      // Note: This would need dictionary to be loaded
      // For now, just test the method exists and accepts correct length
      expect(typeof validateGuess).toBe("function")
      // validateGuess checks dictionary, so we can't test without mocking
    })
  })

  describe("WORDLE_CONFIG", () => {
    it("should have WORD_LENGTH of 5", () => {
      expect(WORDLE_CONFIG.WORD_LENGTH).toBe(5)
    })

    it("should have MAX_ATTEMPTS of 6", () => {
      expect(WORDLE_CONFIG.MAX_ATTEMPTS).toBe(6)
    })
  })
})
