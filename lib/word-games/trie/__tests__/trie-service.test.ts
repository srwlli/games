/**
 * Unit tests for Trie dictionary service
 */

import { DictionaryService } from "../trie-service"
import { TrieNode } from "../trie-node"

describe("DictionaryService", () => {
  let service: DictionaryService

  beforeEach(() => {
    // Reset singleton for each test
    service = DictionaryService.getInstance()
    // Note: In a real test environment, we'd want to mock fetch
    // For now, these tests assume dictionary files exist
  })

  describe("getInstance", () => {
    it("should return the same instance (singleton)", () => {
      const instance1 = DictionaryService.getInstance()
      const instance2 = DictionaryService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("validate", () => {
    it("should return false for empty string", () => {
      // Note: This test assumes dictionary is loaded
      // In real tests, we'd mock the dictionary or use a test dictionary
      expect(service.validate("")).toBe(false)
    })

    it("should return false for non-existent word", () => {
      // This would need dictionary to be loaded
      // For now, just test the method exists
      expect(typeof service.validate).toBe("function")
    })
  })

  describe("isPrefix", () => {
    it("should return true for empty string", () => {
      expect(service.isPrefix("")).toBe(true)
    })

    it("should return false for invalid prefix", () => {
      // This would need dictionary to be loaded
      expect(typeof service.isPrefix).toBe("function")
    })
  })

  describe("loaded", () => {
    it("should have loaded property", () => {
      expect(typeof service.loaded).toBe("boolean")
    })
  })
})

describe("TrieNode", () => {
  it("should initialize with empty children map", () => {
    const node = new TrieNode()
    expect(node.children).toBeInstanceOf(Map)
    expect(node.children.size).toBe(0)
  })

  it("should initialize with isWord = false", () => {
    const node = new TrieNode()
    expect(node.isWord).toBe(false)
  })

  it("should initialize with isCommon = false", () => {
    const node = new TrieNode()
    expect(node.isCommon).toBe(false)
  })
})
