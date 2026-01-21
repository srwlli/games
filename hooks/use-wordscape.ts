"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { WordscapeEngine } from "@/lib/word-games/wordscape/engine"
import { WORDSCAPE_LEVELS } from "@/lib/word-games/wordscape/levels"
import { WordscapeState, GridCell, Position } from "@/lib/word-games/wordscape/types"

export function useWordscape() {
  const engine = useMemo(() => new WordscapeEngine(), [])
  const [levelIndex, setLevelIndex] = useState(0)
  const currentLevel = WORDSCAPE_LEVELS[levelIndex]
  
  const [grid, setGrid] = useState<GridCell[][]>(() => engine.generateGrid(currentLevel))
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [bonusWords, setBonusWords] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [currentSelection, setCurrentSelection] = useState("")
  const [status, setStatus] = useState<'playing' | 'level_complete'>('playing')

  // Reset state when level changes
  useEffect(() => {
    setGrid(engine.generateGrid(currentLevel))
    setFoundWords([])
    setBonusWords([])
    setScore(0)
    setStatus('playing')
    setCurrentSelection("")
  }, [levelIndex, currentLevel, engine])

  const submitSelection = useCallback((selection: string) => {
    if (status !== 'playing') return

    const result = engine.validateSelection(selection, currentLevel, [...foundWords, ...bonusWords])
    
    if (result.type === 'grid') {
      const word = selection.toUpperCase()
      setFoundWords(prev => [...prev, word])
      setScore(prev => prev + word.length * 10)
      
      // Update grid
      setGrid(prev => {
        const newGrid = prev.map(row => row.map(cell => {
          if (cell.isPartOfWordIds.includes(result.wordId!)) {
            return { ...cell, isRevealed: true }
          }
          return cell
        }))
        return newGrid
      })

      // Check level complete
      if (engine.isLevelComplete(currentLevel, [...foundWords, word])) {
        setStatus('level_complete')
      }
    } else if (result.type === 'bonus') {
      const word = selection.toUpperCase()
      setBonusWords(prev => [...prev, word])
      setScore(prev => prev + word.length * 5)
    }
    
    setCurrentSelection("")
  }, [status, engine, currentLevel, foundWords, bonusWords])

  const nextLevel = useCallback(() => {
    if (levelIndex < WORDSCAPE_LEVELS.length - 1) {
      setLevelIndex(prev => prev + 1)
    } else {
      // Loop back to level 1 for now
      setLevelIndex(0)
    }
  }, [levelIndex])

  const useHint = useCallback(() => {
    const hintPos = engine.getRandomHint(grid)
    if (hintPos) {
      setGrid(prev => {
        const newGrid = [...prev]
        newGrid[hintPos.row][hintPos.col] = { ...newGrid[hintPos.row][hintPos.col], isRevealed: true }
        return newGrid
      })
      setScore(prev => Math.max(0, prev - 20)) // Hints cost points
    }
  }, [engine, grid])

  const shuffleLetters = useCallback(() => {
    // Logic to shuffle level letters - managed in UI but could be here
  }, [])

  return {
    currentLevel,
    grid,
    score,
    status,
    currentSelection,
    setCurrentSelection,
    submitSelection,
    nextLevel,
    useHint,
    foundWords,
    bonusWords
  }
}
