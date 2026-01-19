"use client"

import { motion, AnimatePresence } from "framer-motion"
import type React from "react"

export interface GameOverModalProps {
  isOpen: boolean
  title: string
  subtitle?: string
  score?: number | string
  scoreLabel?: string
  accentColor: "purple" | "orange" | "red" | "emerald" | "blue"
  onPlayAgain: () => void
  additionalContent?: React.ReactNode
  buttonText?: string
}

const accentColorClasses = {
  purple: {
    border: "border-purple-500",
    text: "text-purple-400",
    button: "bg-purple-500 hover:bg-purple-600",
  },
  orange: {
    border: "border-orange-500",
    text: "text-orange-400",
    button: "bg-orange-500 hover:bg-orange-600",
  },
  red: {
    border: "border-red-500",
    text: "text-red-400",
    button: "bg-red-500 hover:bg-red-600",
  },
  emerald: {
    border: "border-emerald-500",
    text: "text-emerald-400",
    button: "bg-emerald-500 hover:bg-emerald-600",
  },
  blue: {
    border: "border-blue-500",
    text: "text-blue-400",
    button: "bg-blue-500 hover:bg-blue-600",
  },
}

export function GameOverModal({
  isOpen,
  title,
  subtitle,
  score,
  scoreLabel,
  accentColor,
  onPlayAgain,
  additionalContent,
  buttonText = "Play Again",
}: GameOverModalProps) {
  const colors = accentColorClasses[accentColor]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className={`bg-zinc-900 border-2 ${colors.border} rounded-3xl p-10 text-center`}
          >
            <h2 className={`text-5xl font-black ${colors.text} mb-4`}>{title}</h2>
            {score !== undefined && (
              <div className="text-6xl font-black text-white mb-6">{score}</div>
            )}
            {subtitle && <p className="text-zinc-400 mb-8">{subtitle}</p>}
            {scoreLabel && !subtitle && <p className="text-zinc-400 mb-8">{scoreLabel}</p>}
            {additionalContent}
            <button
              onClick={onPlayAgain}
              className={`${colors.button} text-white font-black py-4 px-8 rounded-xl text-lg transition-colors`}
            >
              {buttonText}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
