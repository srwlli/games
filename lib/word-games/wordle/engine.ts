/**
 * Wordle game engine
 * Handles guess validation, feedback calculation, and daily word generation
 */

import { DictionaryService } from '../trie/trie-service'
import { WORDLE_CONFIG } from './config'
import type { LetterState } from './types'

/**
 * Check a guess against the target word and return letter states
 * Returns array of 'correct', 'present', or 'absent' for each letter
 */
export function checkGuess(guess: string, target: string): LetterState[] {
  if (guess.length !== target.length) {
    throw new Error('Guess and target must be same length')
  }

  const result: LetterState[] = Array(WORDLE_CONFIG.WORD_LENGTH).fill('absent')
  const targetChars = target.toUpperCase().split('')
  const guessChars = guess.toUpperCase().split('')

  // Pass 1: Mark correct positions (green)
  guessChars.forEach((char, i) => {
    if (char === targetChars[i]) {
      result[i] = 'correct'
      targetChars[i] = '' // Consume the character
    }
  })

  // Pass 2: Mark present but wrong position (yellow)
  guessChars.forEach((char, i) => {
    if (result[i] !== 'correct' && targetChars.includes(char)) {
      result[i] = 'present'
      const index = targetChars.indexOf(char)
      targetChars[index] = '' // Consume the character
    }
  })

  return result
}

/**
 * Validate if a guess is a valid word
 * For guesses, we accept any word (not just common ones)
 */
export function validateGuess(guess: string): boolean {
  if (guess.length !== WORDLE_CONFIG.WORD_LENGTH) return false
  const dict = DictionaryService.getInstance()
  return dict.validate(guess.toUpperCase(), false)
}

/**
 * Generate a daily word deterministically based on date
 * Uses a simple seed-based selection from common words
 */
export async function generateDailyWord(): Promise<string> {
  const dict = DictionaryService.getInstance()
  if (!dict.loaded) {
    await dict.init()
  }

  // Get today's date as seed (YYYY-MM-DD)
  const today = new Date()
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  // Simple hash function for deterministic selection
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // For now, return a placeholder - in full implementation,
  // we'd need to load common words into an array and select by index
  // This is a simplified version that would need the dictionary to expose
  // a method to get all common words of a specific length
  const commonWords = [
    'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT',
    'AFTER', 'AGAIN', 'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT',
    'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE', 'ALLOY', 'ALONE', 'ALONG', 'ALOUD',
    'ALPHA', 'ALTAR', 'ALTER', 'AMONG', 'AMPLE', 'ANGEL', 'ANGER', 'ANGLE',
    'ANGRY', 'ANIMAL', 'ANKLE', 'ANNOY', 'APART', 'APHID', 'APPLE', 'APPLY',
    'APRIL', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ARROW', 'ARTSY', 'ASIDE',
    'ASKED', 'ASSET', 'ATLAS', 'ATOM', 'ATONE', 'ATTIC', 'AUDIO', 'AUDIT',
    'AUGUST', 'AUNT', 'AURAL', 'AUTUMN', 'AVAIL', 'AVERT', 'AVIARY', 'AVOID',
    'AWAKE', 'AWARD', 'AWARE', 'AWFUL', 'AWOKE', 'AXIAL', 'AXIS', 'AXLE',
  ]

  // Select word based on hash
  const index = Math.abs(hash) % commonWords.length
  const selectedWord = commonWords[index]

  // Verify word exists in common dictionary (prevents cross-game pollution)
  // This ensures only words marked with isCommon = true are selected
  if (!dict.validate(selectedWord, true)) {
    // Fallback to first word if validation fails
    return commonWords[0]
  }

  return selectedWord
}

/**
 * Get a random common word (for practice mode)
 * Note: This is a simplified version - full implementation would
 * query the dictionary service for all common words of length 5
 * 
 * IMPORTANT: This function should only return words that exist in the
 * common dictionary (isCommon = true) to prevent obscure words like 'XYLYL'
 */
export async function getRandomCommonWord(): Promise<string> {
  const dict = DictionaryService.getInstance()
  if (!dict.loaded) {
    await dict.init()
  }

  // Simplified - would need dictionary to expose common word list
  // For now, using a curated list of common 5-letter words
  // In full implementation, would query dictionary for all words where isCommon = true
  const commonWords = [
    'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT',
    'AFTER', 'AGAIN', 'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT',
    'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE', 'ALLOY', 'ALONE', 'ALONG', 'ALOUD',
    'ALPHA', 'ALTAR', 'ALTER', 'AMONG', 'AMPLE', 'ANGEL', 'ANGER', 'ANGLE',
  ]

  // Verify word exists in common dictionary before returning
  const word = commonWords[Math.floor(Math.random() * commonWords.length)]
  
  // Double-check it's a common word (should always pass, but safety check)
  if (!dict.validate(word, true)) {
    // Fallback to first word if validation fails
    return commonWords[0]
  }

  return word
}
