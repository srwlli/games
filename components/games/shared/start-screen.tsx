"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"

export interface StartScreenProps {
  title: string
  description?: string
  onStart: () => void
  children?: ReactNode // For options/mode selection
  controls?: string[] // Keyboard shortcuts to display
  buttonText?: string // Default: "START GAME"
  accentColor?: "emerald" | "blue" | "green" | "purple" | "orange" | "red" | "amber"
}

const accentColorClasses = {
  emerald: "border-emerald-500/50 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
  blue: "border-blue-500/50 bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
  green: "border-green-500/50 bg-green-500 hover:bg-green-600 shadow-green-500/20",
  purple: "border-purple-500/50 bg-purple-500 hover:bg-purple-600 shadow-purple-500/20",
  orange: "border-orange-500/50 bg-orange-500 hover:bg-orange-600 shadow-orange-500/20",
  red: "border-red-500/50 bg-red-500 hover:bg-red-600 shadow-red-500/20",
  amber: "border-amber-500/50 bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
}

export function StartScreen({
  title,
  description,
  onStart,
  children,
  controls,
  buttonText = "START GAME",
  accentColor = "emerald",
}: StartScreenProps) {
  const accentClasses = accentColorClasses[accentColor]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-screen-title"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className={`bg-zinc-900 border-2 ${accentClasses.split(" ")[0]} rounded-3xl p-8 max-w-md w-full mx-4`}
        >
          <h2 id="start-screen-title" className="text-4xl font-black text-white mb-2 tracking-tighter text-center">
            {title}
          </h2>
          {description && <p className="text-zinc-400 mb-6 text-center">{description}</p>}

          {children && <div className="mb-6">{children}</div>}

          <button
            onClick={onStart}
            className={`w-full py-4 ${accentClasses} text-white font-black rounded-xl transition-all mb-6 shadow-lg`}
            aria-label={`Start ${title} game`}
            autoFocus
          >
            {buttonText}
          </button>

          {controls && controls.length > 0 && (
            <>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold border-t border-zinc-800 pt-6">
                Controls
              </div>
              <div className="mt-2 text-xs text-zinc-400 space-y-1">
                {controls.map((control, i) => (
                  <div key={i}>{control}</div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
