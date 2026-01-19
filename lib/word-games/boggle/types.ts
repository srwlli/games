/**
 * Types for Boggle game
 */

export interface BoggleCell {
  letter: string
  row: number
  col: number
}

export interface BogglePosition {
  row: number
  col: number
}

export type BogglePath = BogglePosition[]

export interface BoggleGameState {
  board: string[][]
  foundWords: Set<string>
  score: number
  timeRemaining: number
  isGameOver: boolean
}

export interface BoggleWordResult {
  word: string
  path: BogglePath
  score: number
  isValid: boolean
}
