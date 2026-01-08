"use client"

import type React from "react"

export interface StatItem {
  label: string
  value: string | number
  color?: "emerald" | "purple" | "orange" | "cyan" | "amber" | "white" | "red"
  size?: "compact" | "standard" | "large" | "simple"
  conditionalColor?: (value: number) => string
}

export interface StatsBarProps {
  stats: StatItem[]
  layout?: "inline" | "absolute" | "flex"
  position?: "top" | "center" | "bottom"
  className?: string
}

const colorClasses = {
  emerald: "text-emerald-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  white: "text-white",
  red: "text-red-400",
}

const sizeClasses = {
  compact: {
    padding: "px-4 py-2",
    text: "text-2xl",
    label: "text-xs text-zinc-500 uppercase font-bold tracking-wider",
  },
  standard: {
    padding: "px-6 py-3",
    text: "text-3xl",
    label: "text-xs text-zinc-500 uppercase font-bold tracking-wider",
  },
  large: {
    padding: "px-6 py-3",
    text: "text-4xl",
    label: "text-xs text-zinc-500 uppercase font-bold tracking-wider",
  },
  simple: {
    padding: "px-0 py-0",
    text: "text-xl",
    label: "text-xs text-zinc-400",
  },
}

function StatCard({ stat }: { stat: StatItem }) {
  const size = stat.size || "standard"
  const sizeConfig = sizeClasses[size]
  
  // Determine color - check conditional first, then use default
  let colorClass = "text-white"
  if (stat.conditionalColor && typeof stat.value === "number") {
    const conditionalColor = stat.conditionalColor(stat.value)
    colorClass = colorClasses[conditionalColor as keyof typeof colorClasses] || colorClass
  } else if (stat.color) {
    colorClass = colorClasses[stat.color] || colorClass
  }

  // For simple variant, render without card styling
  if (size === "simple") {
    return (
      <div className="text-center">
        <div className={sizeConfig.label}>{stat.label}</div>
        <div className={`${sizeConfig.text} font-bold ${colorClass}`}>{stat.value}</div>
      </div>
    )
  }

  return (
    <div className={`bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-2xl ${sizeConfig.padding}`}>
      <div className={sizeConfig.label}>{stat.label}</div>
      <div className={`${sizeConfig.text} font-black ${colorClass}`}>{stat.value}</div>
    </div>
  )
}

export function StatsBar({ stats, layout = "inline", position = "top", className = "" }: StatsBarProps) {
  if (stats.length === 0) return null

  // Determine container classes based on layout
  let containerClasses = ""
  switch (layout) {
    case "absolute":
      const positionClasses = {
        top: "absolute top-6 left-0 right-0",
        center: "absolute top-1/2 left-0 right-0 -translate-y-1/2",
        bottom: "absolute bottom-6 left-0 right-0",
      }
      containerClasses = `${positionClasses[position]} z-10`
      if (stats.length === 1) {
        containerClasses += " flex justify-center"
      } else {
        containerClasses += " flex justify-around px-8"
      }
      break
    case "flex":
      containerClasses = "flex justify-between items-start gap-4"
      break
    case "inline":
    default:
      containerClasses = "flex justify-between items-center"
      break
  }

  return (
    <div className={`${containerClasses} ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={`${stat.label}-${index}`} stat={stat} />
      ))}
    </div>
  )
}
