"use client"

import { motion, AnimatePresence } from "framer-motion"

interface CountdownOverlayProps {
  count: number | string | null
  accentColor?: "emerald" | "blue" | "green" | "purple" | "orange" | "red" | "amber" | "cyan"
}

const accentColorClasses = {
  emerald: "text-emerald-500",
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
  red: "text-red-500",
  amber: "text-amber-500",
  cyan: "text-cyan-500",
}

export function CountdownOverlay({ count, accentColor = "emerald" }: CountdownOverlayProps) {
  if (count === null) return null

  const accentClass = accentColorClasses[accentColor]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={String(count)}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 1.2 }}
          className={`text-9xl font-black ${accentClass} select-none drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]`}
        >
          {count}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
