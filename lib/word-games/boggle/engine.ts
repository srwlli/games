/**
 * Boggle game engine
 * Handles board generation, word validation, scoring, and board solving
 */

import { DictionaryService } from '../trie/trie-service'
import { BOGGLE_CONFIG } from './config'
import type { BogglePath, BogglePosition } from './types'

/**
 * Standard 16 Boggle dice configurations
 */
export const BOGGLE_DICE = [
  'AAEEGN',
  'ELRTTY',
  'AOOTTW',
  'ABBJOO',
  'EHRTVW',
  'CIMOTU',
  'DISTTY',
  'EIOSST',
  'DELRVY',
  'ACHOPS',
  'HIMNQU',
  'EEINSU',
  'EEGHNW',
  'AFFKPS',
  'HLNNRZ',
  'DEILRX',
]

/**
 * Calculate score for a word based on length
 */
export function calculateBoggleScore(word: string): number {
  const length = word.length
  if (length < BOGGLE_CONFIG.MIN_WORD_LENGTH) return 0
  if (length === 3) return 1
  if (length === 4) return 2
  if (length === 5) return 3
  if (length === 6) return 5
  if (length === 7) return 7
  if (length >= 8) return 11
  return 0
}

/**
 * Generate a random Boggle board by shuffling dice
 */
export function generateBoard(): string[][] {
  // Shuffle dice
  const shuffledDice = [...BOGGLE_DICE].sort(() => Math.random() - 0.5)

  // Roll each die and create board
  const board: string[][] = []
  for (let i = 0; i < BOGGLE_CONFIG.GRID_SIZE; i++) {
    board[i] = []
    for (let j = 0; j < BOGGLE_CONFIG.GRID_SIZE; j++) {
      const die = shuffledDice[i * BOGGLE_CONFIG.GRID_SIZE + j]
      // Pick random face from die
      const face = die[Math.floor(Math.random() * die.length)]
      // Handle 'Q' -> 'QU' convention
      board[i][j] = face === 'Q' ? 'QU' : face
    }
  }

  return board
}

/**
 * Validate if a word can be formed on the board with a valid path
 */
export function validateWord(
  word: string,
  board: string[][],
  path: BogglePath,
): boolean {
  if (word.length !== path.length) return false
  if (word.length < BOGGLE_CONFIG.MIN_WORD_LENGTH) return false

  // Check if path forms the word
  for (let i = 0; i < path.length; i++) {
    const pos = path[i]
    if (pos.row < 0 || pos.row >= BOGGLE_CONFIG.GRID_SIZE) return false
    if (pos.col < 0 || pos.col >= BOGGLE_CONFIG.GRID_SIZE) return false

    const cellLetter = board[pos.row][pos.col]
    const wordLetter = word[i]

    // Handle QU -> Q mapping
    if (cellLetter === 'QU' && wordLetter === 'Q') {
      continue
    }
    if (cellLetter !== wordLetter) {
      return false
    }
  }

  // Check if path is valid (adjacent cells, no reuse)
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i]
    const next = path[i + 1]

    // Check adjacency
    const rowDiff = Math.abs(current.row - next.row)
    const colDiff = Math.abs(current.col - next.col)
    if (rowDiff > 1 || colDiff > 1 || (rowDiff === 0 && colDiff === 0)) {
      return false
    }

    // Check for reuse
    for (let j = 0; j < i; j++) {
      if (path[j].row === next.row && path[j].col === next.col) {
        return false
      }
    }
  }

  // Validate word exists in dictionary
  const dict = DictionaryService.getInstance()
  return dict.validate(word, false)
}

/**
 * Solve the entire board - find all valid words
 * Uses DFS with Trie prefix pruning for efficiency
 */
export function solveBoard(board: string[][]): Set<string> {
  const dict = DictionaryService.getInstance()
  const found = new Set<string>()
  const visited = Array(BOGGLE_CONFIG.GRID_SIZE)
    .fill(null)
    .map(() => Array(BOGGLE_CONFIG.GRID_SIZE).fill(false))

  const dfs = (row: number, col: number, current: string, path: BogglePath) => {
    // Prune if prefix doesn't exist
    if (!dict.isPrefix(current)) return

    // Check if current path forms a valid word
    if (current.length >= BOGGLE_CONFIG.MIN_WORD_LENGTH && dict.validate(current, false)) {
      found.add(current)
    }

    visited[row][col] = true

    // Explore all 8 adjacent cells
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue

        const nr = row + dr
        const nc = col + dc

        if (
          nr >= 0 &&
          nr < BOGGLE_CONFIG.GRID_SIZE &&
          nc >= 0 &&
          nc < BOGGLE_CONFIG.GRID_SIZE &&
          !visited[nr][nc]
        ) {
          const cellLetter = board[nr][nc]
          const nextChar = cellLetter === 'QU' ? 'Q' : cellLetter
          dfs(nr, nc, current + nextChar, [...path, { row: nr, col: nc }])
        }
      }
    }

    visited[row][col] = false
  }

  // Start DFS from each cell
  for (let r = 0; r < BOGGLE_CONFIG.GRID_SIZE; r++) {
    for (let c = 0; c < BOGGLE_CONFIG.GRID_SIZE; c++) {
      const cellLetter = board[r][c]
      const startChar = cellLetter === 'QU' ? 'Q' : cellLetter
      dfs(r, c, startChar, [{ row: r, col: c }])
    }
  }

  return found
}
