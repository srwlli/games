/**
 * GAME REGISTRY - The source of truth for all games
 * Add new games here to make them available in the platform
 */

import PickUpSticks from "@/components/games/pick-up-sticks"
import MemoryMatch from "@/components/games/memory-match"
import ReflexTapper from "@/components/games/reflex-tapper"
import Tetris from "@/components/games/tetris"
import Fishing from "@/components/games/fishing"
import Boggle from "@/components/games/boggle"
import Wordle from "@/components/games/wordle"

export const GAMES_REGISTRY = {
  "pick-up-sticks": {
    id: "pick-up-sticks",
    title: "Pick Up Sticks",
    description: "Clear the forest path before time runs out.",
    category: "Mini-Game",
    color: "bg-emerald-500",
    component: PickUpSticks,
    thumbnail: "🌲",
  },
  "memory-match": {
    id: "memory-match",
    title: "Memory Match",
    description: "Flip cards and match pairs to win.",
    category: "Brain Game",
    color: "bg-purple-500",
    component: MemoryMatch,
    thumbnail: "🧠",
  },
  "reflex-tapper": {
    id: "reflex-tapper",
    title: "Reflex Tapper",
    description: "Tap the targets as fast as you can.",
    category: "Action",
    color: "bg-orange-500",
    component: ReflexTapper,
    thumbnail: "⚡",
  },
  tetris: {
    id: "tetris",
    title: "Block Drop",
    description: "Stack and clear lines in this classic puzzle game.",
    category: "Puzzle",
    color: "bg-purple-500",
    component: Tetris,
    thumbnail: "🟦",
  },
  fishing: {
    id: "fishing",
    title: "Fishing Master",
    description: "Catch fish using 5 different techniques.",
    category: "Action",
    color: "bg-cyan-500",
    component: Fishing,
    thumbnail: "🎣",
  },
  boggle: {
    id: "boggle",
    title: "Boggle",
    description: "Find as many words as you can in 3 minutes.",
    category: "Word Game",
    color: "bg-blue-500",
    component: Boggle,
    thumbnail: "🔤",
  },
  wordle: {
    id: "wordle",
    title: "Wordle",
    description: "Guess the 5-letter word in 6 tries.",
    category: "Word Game",
    color: "bg-green-500",
    component: Wordle,
    thumbnail: "📝",
  },
}
