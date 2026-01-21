"use client"

import { motion } from "framer-motion"
import { StatItem } from "./stats-bar"

interface UnifiedHUDProps {
  stats: StatItem[]
  className?: string
}

export function UnifiedHUD({ stats, className = "" }: UnifiedHUDProps) {
  if (stats.length === 0) return null

  return (
    <div className={`w-full flex items-center justify-center pointer-events-none ${className}`}>
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl px-6 py-3 flex items-center gap-6 shadow-2xl">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                {stat.label}
              </span>
              <motion.span
                key={String(stat.value)}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl font-black tabular-nums leading-none ${
                  stat.color === "emerald" ? "text-emerald-400" :
                  stat.color === "purple" ? "text-purple-400" :
                  stat.color === "orange" ? "text-orange-400" :
                  stat.color === "red" ? "text-red-400" :
                  stat.color === "blue" ? "text-blue-400" :
                  stat.color === "cyan" ? "text-cyan-400" :
                  stat.color === "amber" ? "text-amber-400" : "text-white"
                }`}
              >
                {stat.value}
              </motion.span>
            </div>
            {index < stats.length - 1 && (
              <div className="w-[1px] h-8 bg-zinc-800" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
