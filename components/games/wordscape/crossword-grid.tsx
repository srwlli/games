"use client"

import { motion, AnimatePresence } from "framer-motion"
import { GridCell } from "@/lib/word-games/wordscape/types"

interface CrosswordGridProps {
  grid: GridCell[][]
  levelId: number
}

export default function CrosswordGrid({ grid, levelId }: CrosswordGridProps) {
  const rows = grid.length
  const cols = grid[0]?.length || 0

  return (
    <div
      className="grid gap-1 sm:gap-2 p-4 bg-zinc-900/20 rounded-3xl backdrop-blur-sm border border-white/5"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        width: "min(90vw, 400px)",
        aspectRatio: `${cols}/${rows}`,
      }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <div key={`${levelId}-${r}-${c}`} className="aspect-square">
            {cell.letter ? (
              <motion.div
                className={`w-full h-full rounded-lg flex items-center justify-center text-xl sm:text-2xl font-black transition-all border-2 ${
                  cell.isRevealed
                    ? "bg-zinc-100 text-zinc-950 border-zinc-300 shadow-lg"
                    : "bg-zinc-800/50 text-transparent border-zinc-700/50"
                }`}
                animate={cell.isRevealed ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {cell.letter}
              </motion.div>
            ) : (
              <div className="w-full h-full bg-transparent" />
            )}
          </div>
        ))
      )}
    </div>
  )
}
