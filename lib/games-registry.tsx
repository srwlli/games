/**
 * GAME REGISTRY - The source of truth for all games
 * Add new games here to make them available in the platform
 */

import ZenMerge from "@/components/games/zen-merge"
import MemoryMatch from "@/components/games/memory-match"
import ReflexTapper from "@/components/games/reflex-tapper"
import Tetris from "@/components/games/tetris"
import Fishing from "@/components/games/fishing"
import Boggle from "@/components/games/boggle"
import Wordle from "@/components/games/wordle"
import MathFlashCards from "@/components/games/math-flash-cards"
import Wordscape from "@/components/games/wordscape"

export const GAMES_REGISTRY = {
  "math-flash-cards": {
    id: "math-flash-cards",
    title: "Math Flash Cards",
    description: "Master multiplication and division in a 60-second sprint.",
    category: "Math Game",
    color: "bg-emerald-600",
    component: MathFlashCards,
    thumbnail: "Calculator",
  },
  wordscape: {
    id: "wordscape",
    title: "Wordscape",
    description: "Connect letters to fill the crossword puzzle.",
    category: "Word Game",
    color: "bg-emerald-500",
    component: Wordscape,
    thumbnail: "Puzzle",
  },
  "zen-merge": {
    id: "zen-merge",
    title: "Zen Merge",
    description: "Combine mysterious shards to discover the Zen Infinity crystal.",
    category: "Work In Progress",
    color: "bg-indigo-600",
    component: ZenMerge,
    thumbnail: "Sparkles",
  },
  "memory-match": {
    id: "memory-match",
    title: "Memory Match",
    description: "Flip cards and match pairs to win.",
    category: "Classic",
    color: "bg-purple-500",
    component: MemoryMatch,
    thumbnail: "Brain",
  },
  "reflex-tapper": {
    id: "reflex-tapper",
    title: "Reflex Tapper",
    description: "Tap the targets as fast as you can.",
    category: "Action",
    color: "bg-orange-500",
    component: ReflexTapper,
    thumbnail: "Zap",
  },
  tetris: {
    id: "tetris",
    title: "Block Drop",
    description: "Stack and clear lines in this classic puzzle game.",
    category: "Classic",
    color: "bg-purple-500",
    component: Tetris,
    thumbnail: "Boxes",
  },
  fishing: {
    id: "fishing",
    title: "Fishing Master",
    description: "Catch fish using 5 different techniques.",
    category: "Work In Progress",
    color: "bg-cyan-500",
    component: Fishing,
    thumbnail: "Fish",
  },
  boggle: {
    id: "boggle",
    title: "Boggle",
    description: "Find as many words as you can in 3 minutes.",
    category: "Word Game",
    color: "bg-blue-500",
    component: Boggle,
    thumbnail: "Grid3x3",
  },
  wordle: {
    id: "wordle",
    title: "Wordle",
    description: "Guess the 5-letter word in 6 tries.",
    category: "Word Game",
    color: "bg-green-500",
    component: Wordle,
    thumbnail: "FileText",
  },
}
