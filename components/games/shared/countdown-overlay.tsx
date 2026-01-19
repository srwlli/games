"use client"

import { motion, AnimatePresence } from "framer-motion"

interface CountdownOverlayProps {
  count: number | null
  accentColor?: "emerald" | "blue" | "green" | "purple" | "orange" | "red" | "amber"
}

const accentColorClasses = {
  emerald: "text-emerald-500",
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
  red: "text-red-500",
  amber: "text-amber-500",
}

export function CountdownOverlay({ count, accentColor = "emerald" }: CountdownOverlayProps) {
  if (count === null || count <= 0) return null

  const accentClass = accentColorClasses[accentColor]

  return (
    <AnimatePresence>
      <motion.div
        key={count}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 1.2 }}
          className={`text-9xl font-black ${accentClass} select-none`}
        >
          {count}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
