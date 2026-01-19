"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatsBar, GameOverModal } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"
import { DictionaryService } from "@/lib/word-games/trie/trie-service"
import { checkGuess, validateGuess, generateDailyWord, getRandomCommonWord } from "@/lib/word-games/wordle/engine"
import { WORDLE_CONFIG } from "@/lib/word-games/wordle/config"
import type { LetterState, WordleGuess } from "@/lib/word-games/wordle/types"

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
]

export default function Wordle() {
  const { isPlaying, isPaused, isGameOver, pause, resume, gameOver, reset, start } = useGameState({
    initialState: "idle",
  })
  const { updateScore, endGameSession } = useGameSessionIntegration("wordle")

  const [targetWord, setTargetWord] = useState<string>("")
  const [guesses, setGuesses] = useState<WordleGuess[]>([])
  const [currentGuess, setCurrentGuess] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isWon, setIsWon] = useState(false)
  const [letterStates, setLetterStates] = useState<Map<string, LetterState>>(new Map())

  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize dictionary and load target word
  useEffect(() => {
    const initGame = async () => {
      try {
        const dict = DictionaryService.getInstance()
        await dict.init()
        // For now, use random word - in full implementation would use generateDailyWord()
        const word = await getRandomCommonWord()
        setTargetWord(word)
        setIsLoading(false)
        // Auto-start game once word is loaded
        if (word) {
          start()
        }
      } catch (error) {
        console.error("Failed to initialize Wordle:", error)
        setIsLoading(false)
      }
    }
    initGame()
  }, [start])

  // Start game
  const startGame = useCallback(async () => {
    try {
      const dict = DictionaryService.getInstance()
      if (!dict.loaded) {
        await dict.init()
      }
      const word = await getRandomCommonWord()
      setTargetWord(word)
      setGuesses([])
      setCurrentGuess("")
      setIsWon(false)
      setLetterStates(new Map())
      start()
    } catch (error) {
      console.error("Failed to start game:", error)
    }
  }, [start])

  // Handle game over
  const handleGameOver = useCallback(
    (won: boolean) => {
      setIsWon(won)
      gameOver()
      const score = won ? (WORDLE_CONFIG.MAX_ATTEMPTS - guesses.length + 1) * 100 : 0
      endGameSession(score, {
        won,
        attempts: guesses.length,
        targetWord: targetWord,
      })
    },
    [gameOver, guesses.length, targetWord, endGameSession],
  )

  // Handle letter input
  const handleLetter = useCallback(
    (letter: string) => {
      // Allow input if game is playing and not paused, or if game hasn't started yet (idle state)
      if (isPaused || currentGuess.length >= WORDLE_CONFIG.WORD_LENGTH) return
      if (!isPlaying && targetWord === "") return // Don't allow input if target word isn't loaded
      setCurrentGuess((prev) => prev + letter.toUpperCase())
    },
    [isPlaying, isPaused, currentGuess.length, targetWord],
  )

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isPaused || currentGuess.length === 0) return
    if (!isPlaying && targetWord === "") return // Don't allow input if target word isn't loaded
    setCurrentGuess((prev) => prev.slice(0, -1))
  }, [isPlaying, isPaused, currentGuess.length, targetWord])

  // Handle enter/guess submission
  const handleEnter = useCallback(() => {
    if (isPaused || currentGuess.length !== WORDLE_CONFIG.WORD_LENGTH) return
    if (!isPlaying) {
      // Auto-start game if not started yet
      if (targetWord && currentGuess.length === WORDLE_CONFIG.WORD_LENGTH) {
        start()
      }
      return
    }

    // Validate guess
    if (!validateGuess(currentGuess)) {
      // Show error feedback (could add shake animation)
      return
    }

    // Check guess
    const states = checkGuess(currentGuess, targetWord)
    const newGuess: WordleGuess = {
      word: currentGuess,
      states,
    }

    const updatedGuesses = [...guesses, newGuess]
    setGuesses(updatedGuesses)

    // Update letter states for keyboard
    const newLetterStates = new Map(letterStates)
    currentGuess.split("").forEach((letter, i) => {
      const currentState = newLetterStates.get(letter)
      const newState = states[i]
      
      // Always prefer correct over present, and present over absent
      if (!currentState) {
        newLetterStates.set(letter, newState)
      } else if (newState === "correct") {
        // Always update to correct if we see it (even if current is present)
        newLetterStates.set(letter, "correct")
      } else if (newState === "present" && currentState === "absent") {
        // Upgrade from absent to present
        newLetterStates.set(letter, "present")
      }
      // If currentState is already correct or present, and newState is worse, don't downgrade
    })
    setLetterStates(newLetterStates)

    // Check win condition
    if (currentGuess.toUpperCase() === targetWord.toUpperCase()) {
      setIsWon(true)
      setTimeout(() => handleGameOver(true), 500)
      return
    }

    // Check lose condition - use updatedGuesses.length instead of guesses.length + 1
    if (updatedGuesses.length >= WORDLE_CONFIG.MAX_ATTEMPTS) {
      setTimeout(() => handleGameOver(false), 500)
      return
    }

    setCurrentGuess("")
  }, [isPlaying, isPaused, currentGuess, targetWord, guesses.length, letterStates, handleGameOver])

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow input even if game hasn't started (will auto-start on Enter)
      if (isPaused) return

      if (e.key === "Enter") {
        handleEnter()
      } else if (e.key === "Backspace") {
        handleBackspace()
      } else if (e.key.length === 1 && /[A-Za-z]/.test(e.key)) {
        handleLetter(e.key)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, isPaused, handleEnter, handleBackspace, handleLetter])

  // Handle restart
  const handleRestart = useCallback(() => {
    reset()
    startGame()
  }, [reset, startGame])

  const togglePause = useCallback(() => {
    // Only toggle if game is actually playing or paused - prevent accidental resets
    if (isPlaying) {
      pause()
    } else if (isPaused) {
      resume()
    }
    // If game is idle or gameOver, do nothing (don't reset)
  }, [isPlaying, isPaused, pause, resume])

  // Get color for letter state
  const getStateColor = (state: LetterState): string => {
    switch (state) {
      case "correct":
        return "bg-green-500"
      case "present":
        return "bg-yellow-500"
      case "absent":
        return "bg-zinc-700"
      default:
        return "bg-zinc-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-4">Loading...</div>
          <div className="text-zinc-400">Preparing your puzzle</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center bg-black" 
      style={{ 
        height: "100svh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
      {/* Stats Bar */}
      {isPlaying && (
        <StatsBar
          stats={[
            {
              label: "Attempts",
              value: `${guesses.length}/${WORDLE_CONFIG.MAX_ATTEMPTS}`,
              color: "green",
            },
            {
              label: "Status",
              value: isWon ? "Won!" : guesses.length >= WORDLE_CONFIG.MAX_ATTEMPTS ? "Lost" : "Playing",
              color: isWon ? "emerald" : guesses.length >= WORDLE_CONFIG.MAX_ATTEMPTS ? "red" : "white",
            },
          ]}
          layout="absolute"
          position="top"
        />
      )}

      {/* Game Grid - 6 rows x 5 columns */}
      <div className="flex flex-col items-center gap-6 mt-20" style={{ maxHeight: "calc(100svh - 200px)", overflowY: "auto" }}>
        <div 
          className="grid gap-2 w-full max-w-md px-4"
          style={{ 
            gridTemplateColumns: `repeat(${WORDLE_CONFIG.WORD_LENGTH}, minmax(0, 1fr))`,
            gridAutoRows: "1fr"
          }}
        >
          {Array.from({ length: WORDLE_CONFIG.MAX_ATTEMPTS }).flatMap((_, rowIdx) => 
            Array.from({ length: WORDLE_CONFIG.WORD_LENGTH }).map((_, colIdx) => {
              const guess = guesses[rowIdx]
              const isActiveRow = rowIdx === guesses.length
              const letter = guess ? guess.word[colIdx] : isActiveRow ? currentGuess[colIdx] || "" : ""
              const state = guess ? guess.states[colIdx] : undefined
              const isCurrentCell = isActiveRow && colIdx === currentGuess.length

              return (
                <motion.div
                  key={`${rowIdx}-${colIdx}`}
                  className={`
                    aspect-square
                    flex items-center justify-center
                    text-xl sm:text-2xl font-black text-white
                    rounded-lg border-2
                    ${state ? getStateColor(state) : "bg-zinc-800 border-zinc-700"}
                    ${isCurrentCell ? "border-green-400 ring-2 ring-green-400/50" : ""}
                    transition-all
                  `}
                  animate={state ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {letter}
                </motion.div>
              )
            })
          )}
        </div>

        {/* On-screen Keyboard */}
        <div className="flex flex-col gap-2 mt-4">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 justify-center">
              {row.map((key) => {
                const isSpecial = key === "ENTER" || key === "BACKSPACE"
                const letterState = letterStates.get(key)

                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "ENTER") handleEnter()
                      else if (key === "BACKSPACE") handleBackspace()
                      else handleLetter(key)
                    }}
                    className={`
                      ${isSpecial ? "px-3 text-xs" : "px-3 text-sm"}
                      py-2 font-bold rounded
                      ${letterState ? getStateColor(letterState) : "bg-zinc-700"}
                      text-white hover:bg-zinc-600
                      transition-colors
                    `}
                  >
                    {key === "BACKSPACE" ? "⌫" : key}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-4 mt-4">
          {!isPlaying && (
            <button
              onClick={startGame}
              className="bg-green-500 hover:bg-green-600 text-white font-black py-3 px-6 rounded-xl transition-colors"
            >
              Start Game
            </button>
          )}
          {(isPlaying || isPaused) && (
            <button
              onClick={togglePause}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
          )}
        </div>
      </div>

      {/* Start Screen */}
      {!isPlaying && guesses.length === 0 && (
        <div className="text-center">
          <h2 className="text-4xl font-black text-white mb-4">Wordle</h2>
          <p className="text-zinc-400 mb-8">Guess the 5-letter word in 6 tries!</p>
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-8 rounded-xl text-lg transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-10">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-4">Paused</h2>
            <button
              onClick={togglePause}
              className="bg-green-500 hover:bg-green-600 text-white font-black py-3 px-6 rounded-xl transition-colors"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        title={isWon ? "Congratulations!" : "Game Over"}
        subtitle={isWon ? `You guessed it in ${guesses.length} tries!` : `The word was: ${targetWord}`}
        score={isWon ? (WORDLE_CONFIG.MAX_ATTEMPTS - guesses.length + 1) * 100 : 0}
        scoreLabel="Score"
        accentColor={isWon ? "emerald" : "red"}
        onPlayAgain={handleRestart}
      />

      {/* Hidden input for mobile keyboard */}
      <input
        ref={inputRef}
        type="text"
        value={currentGuess}
        onChange={(e) => {
          const value = e.target.value.toUpperCase().slice(0, WORDLE_CONFIG.WORD_LENGTH)
          setCurrentGuess(value)
        }}
        className="absolute opacity-0 pointer-events-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    </div>
  )
}
