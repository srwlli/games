"use client"

import { motion, AnimatePresence } from "framer-motion"
import { memo } from "react"

interface ScorePopupProps {
  score: number
  x: number
  y: number
  isVisible: boolean
}

export const ScorePopup = memo(function ScorePopup({ score, x, y, isVisible }: ScorePopupProps) {
  if (!isVisible || score === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 0, scale: 0.8 }}
        animate={{ opacity: 1, y: -30, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.6 }}
        transition={{ duration: 0.6 }}
        className="absolute pointer-events-none z-50"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-lg">
          +{score}
        </div>
      </motion.div>
    </AnimatePresence>
  )
})
