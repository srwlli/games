/**
 * DictionaryService - Singleton Trie-based dictionary service
 * Loads dictionaries from public/word-games/dictionaries/ via fetch
 * Uses Promise-based lock to prevent concurrent initialization
 */

import { TrieNode } from './trie-node'
import type { DictionarySource, DictionaryLoadResult } from './types'

export class DictionaryService {
  private static instance: DictionaryService
  private root: TrieNode = new TrieNode()
  private isLoaded: boolean = false
  private initPromise: Promise<void> | null = null // Lock mechanism
  private wordCounts: { full: number; common: number } = { full: 0, common: 0 }

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): DictionaryService {
    if (!this.instance) {
      this.instance = new DictionaryService()
    }
    return this.instance
  }

  /**
   * Initialize the dictionary service by loading word lists
   * Uses Promise-based lock to prevent concurrent initialization
   * Multiple components calling init() simultaneously will await the same Promise
   */
  public async init(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded) return

    // If initialization is in progress, return the existing promise
    if (this.initPromise) {
      return this.initPromise
    }

    // Start initialization and store the promise
    this.initPromise = this._doInit()
    return this.initPromise
  }

  private async _doInit(): Promise<void> {
    const sources: DictionarySource[] = [
      { path: '/word-games/dictionaries/sowpods.txt', type: 'full' },
      { path: '/word-games/dictionaries/common.txt', type: 'common' },
    ]

    try {
      // Reset word counts
      this.wordCounts = { full: 0, common: 0 }

      for (const source of sources) {
        const resp = await fetch(source.path)
        if (!resp.ok) {
          throw new Error(`Failed to load dictionary: ${source.path} (${resp.status})`)
        }

        // Use streaming reader for large files to avoid blocking main thread
        const reader = resp.body?.getReader()
        if (!reader) {
          // Fallback to text() if streaming not available
          const text = await resp.text()
          await this._processTextChunk(text, source.type === 'common')
          continue
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let wordCount = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode chunk and append to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete lines (ending with \n)
          const lines = buffer.split('\n')
          // Keep incomplete line in buffer
          buffer = lines.pop() || ''

          // Process complete lines
          for (const line of lines) {
            const word = line.trim().toUpperCase()
            if (word.length > 0) {
              this.insert(word, source.type === 'common')
              wordCount++
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim().length > 0) {
          const word = buffer.trim().toUpperCase()
          if (word.length > 0) {
            this.insert(word, source.type === 'common')
            wordCount++
          }
        }

        // Update word counts
        if (source.type === 'common') {
          this.wordCounts.common = wordCount
        } else {
          this.wordCounts.full = wordCount
        }
      }

      this.isLoaded = true
    } catch (error) {
      // Clear promise on error so retry is possible
      this.initPromise = null
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Dictionary initialization failed: ${errorMessage}`)
    }
  }

  /**
   * Process text chunk (fallback for non-streaming environments)
   */
  private async _processTextChunk(text: string, isCommon: boolean): Promise<void> {
    const words = text.split('\n').filter((line) => line.trim().length > 0)
    let wordCount = 0

    for (const word of words) {
      const normalized = word.trim().toUpperCase()
      if (normalized.length > 0) {
        this.insert(normalized, isCommon)
        wordCount++
      }
    }

    if (isCommon) {
      this.wordCounts.common = wordCount
    } else {
      this.wordCounts.full = wordCount
    }
  }

  /**
   * Insert a word into the Trie
   * Enforces case normalization and proper isCommon flag tagging
   */
  private insert(word: string, isCommon: boolean): void {
    if (!word || word.length === 0) return

    // Normalize to uppercase for consistent lookups
    const normalized = word.toUpperCase()
    let node = this.root

    for (const char of normalized) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode())
      }
      node = node.children.get(char)!
    }

    // Mark as word
    node.isWord = true

    // Tag as common if specified (prevents cross-game pollution)
    // If word already exists from full dictionary, preserve common tag if it was already set
    if (isCommon) {
      node.isCommon = true
    }
    // Note: If a word exists in both dictionaries, isCommon will be set to true
    // This is correct behavior - common words should be accessible for Wordle targets
  }

  /**
   * Validate if a word exists in the dictionary
   * @param word - Word to validate
   * @param requireCommon - If true, only validates common words (for Wordle targets)
   * @returns true if word exists (and is common if requireCommon is true)
   */
  public validate(word: string, requireCommon: boolean = false): boolean {
    if (!word || word.length === 0) return false

    const node = this.find(word.toUpperCase())
    if (!node) return false

    if (requireCommon) {
      return node.isWord && node.isCommon
    }
    return node.isWord
  }

  /**
   * Check if a prefix exists in the dictionary
   * Critical for Boggle DFS pruning - stops search early if no words start with prefix
   */
  public isPrefix(prefix: string): boolean {
    if (!prefix || prefix.length === 0) return true
    return this.find(prefix.toUpperCase()) !== null
  }

  /**
   * Find the node corresponding to a string
   */
  private find(str: string): TrieNode | null {
    let node = this.root
    for (const char of str.toUpperCase()) {
      if (!node.children.has(char)) {
        return null
      }
      node = node.children.get(char)!
    }
    return node
  }

  /**
   * Check if dictionary is loaded
   */
  public get loaded(): boolean {
    return this.isLoaded
  }

  /**
   * Health check - returns word counts to verify successful loading
   * Useful for debugging and verifying dictionary integrity
   */
  public getHealthCheck(): {
    loaded: boolean
    wordCounts: { full: number; common: number }
    totalWords: number
  } {
    return {
      loaded: this.isLoaded,
      wordCounts: { ...this.wordCounts },
      totalWords: this.wordCounts.full + this.wordCounts.common,
    }
  }
}
