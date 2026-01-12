"use client"

import { motion, AnimatePresence } from "framer-motion"
import { memo } from "react"

interface LineClearAnimationProps {
  lines: number[]
  isVisible: boolean
}

export const LineClearAnimation = memo(function LineClearAnimation({
  lines,
  isVisible,
}: LineClearAnimationProps) {
  if (!isVisible || lines.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-40"
      >
        {lines.map((line, index) => (
          <motion.div
            key={line}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{
              top: `${(line / 20) * 100}%`,
            }}
          >
            <div className="bg-white/80 text-purple-900 px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
              {lines.length === 4 ? "TETRIS!" : `${lines.length} LINES`}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
})
