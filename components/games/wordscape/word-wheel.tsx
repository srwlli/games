"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"

interface WordWheelProps {
  letters: string[]
  onSelectionComplete: (selection: string) => void
  onSelectionChange?: (selection: string) => void
  size?: number
}

interface LetterPosition {
  index: number
  char: string
  x: number
  y: number
}

export default function WordWheel({ letters, onSelectionComplete, onSelectionChange, size = 280 }: WordWheelProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const radius = size / 2.5
  const center = size / 2

  const letterPositions: LetterPosition[] = letters.map((char, i) => {
    const angle = (i * 2 * Math.PI) / letters.length - Math.PI / 2
    return {
      index: i,
      char,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  })

  const handlePointerDown = (index: number) => {
    setSelectedIndices([index])
    onSelectionChange?.(letters[index])
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (selectedIndices.length === 0) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPointerPos({ x, y })

    // Check if pointer is over another letter
    letterPositions.forEach((pos) => {
      if (selectedIndices.includes(pos.index)) return

      const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
      if (dist < 30) {
        const newSelection = [...selectedIndices, pos.index]
        setSelectedIndices(newSelection)
        const selectionText = newSelection.map((idx) => letters[idx]).join("")
        onSelectionChange?.(selectionText)
        
        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(10)
        }
      }
    })
  }

  const handlePointerUp = () => {
    if (selectedIndices.length > 0) {
      const selectionText = selectedIndices.map((idx) => letters[idx]).join("")
      onSelectionComplete(selectionText)
    }
    setSelectedIndices([])
    setPointerPos(null)
    onSelectionChange?.("")
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none"
      style={{ width: size, height: size }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* SVG for connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {selectedIndices.length > 1 && (
          <path
            d={selectedIndices
              .map((idx, i) => {
                const pos = letterPositions[idx]
                return `${i === 0 ? "M" : "L"} ${pos.x} ${pos.y}`
              })
              .join(" ")}
            fill="none"
            stroke="rgba(16, 185, 129, 0.6)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {selectedIndices.length > 0 && pointerPos && (
          <line
            x1={letterPositions[selectedIndices[selectedIndices.length - 1]].x}
            y1={letterPositions[selectedIndices[selectedIndices.length - 1]].y}
            x2={pointerPos.x}
            y2={pointerPos.y}
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Letters */}
      {letterPositions.map((pos) => {
        const isSelected = selectedIndices.includes(pos.index)
        return (
          <motion.div
            key={pos.index}
            className={`absolute flex items-center justify-center w-14 h-14 rounded-full text-2xl font-black transition-colors shadow-lg cursor-pointer ${
              isSelected ? "bg-emerald-500 text-zinc-950 border-4 border-emerald-300" : "bg-zinc-800 text-white border-2 border-zinc-700"
            }`}
            style={{
              left: pos.x - 28,
              top: pos.y - 28,
              zIndex: 2,
            }}
            onPointerDown={() => handlePointerDown(pos.index)}
            animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
          >
            {pos.char}
          </motion.div>
        );
      })}

      {/* Center circle */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm -z-10"
      />
    </div>
  );
}
