"use client"

import { memo } from "react"

interface MobileControlsProps {
  onMoveLeft: () => void
  onMoveRight: () => void
  onMoveDown: () => void
  onRotate: () => void
  onHardDrop: () => void
  isPlaying: boolean
}

export const MobileControls = memo(function MobileControls({
  onMoveLeft,
  onMoveRight,
  onMoveDown,
  onRotate,
  onHardDrop,
  isPlaying,
}: MobileControlsProps) {
  if (!isPlaying) return null

  return (
    <div className="mt-4 flex flex-col items-center gap-3 md:hidden" role="group" aria-label="Game controls">
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-1">
        <div></div>
        <button
          onClick={onMoveDown}
          className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center justify-center text-xl font-bold"
          aria-label="Move piece down"
        >
          ↓
        </button>
        <div></div>
        <button
          onClick={onMoveLeft}
          className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center justify-center text-xl font-bold"
          aria-label="Move piece left"
        >
          ←
        </button>
        <div></div>
        <button
          onClick={onMoveRight}
          className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center justify-center text-xl font-bold"
          aria-label="Move piece right"
        >
          →
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRotate}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg border border-purple-500 text-sm font-medium"
          aria-label="Rotate piece"
        >
          Rotate
        </button>
        <button
          onClick={onHardDrop}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-red-500 text-sm font-medium"
          aria-label="Hard drop"
        >
          Drop
        </button>
      </div>
    </div>
  )
})
