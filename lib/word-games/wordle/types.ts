/**
 * Types for Wordle game
 */

export type LetterState = 'absent' | 'present' | 'correct'

export interface WordleGuess {
  word: string
  states: LetterState[]
}

export interface WordleGameState {
  guesses: WordleGuess[]
  targetWord: string
  attemptsRemaining: number
  isWon: boolean
  isLost: boolean
  currentGuess: string
}
