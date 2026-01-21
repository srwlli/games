"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { GameIcon } from "@/lib/game-icons"

interface GamePlatformHeaderProps {
  title: string
  backHref: string
  backLabel?: string
  iconName?: string
  accentColor?: string
}

export function GamePlatformHeader({
  title,
  backHref,
  backLabel = "Exit",
  iconName,
  accentColor = "text-emerald-500",
}: GamePlatformHeaderProps) {
  return (
    <nav
      className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md z-50 w-full"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <Link href={backHref} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={20} />
        <span className="text-sm font-bold uppercase tracking-tighter">{backLabel}</span>
      </Link>

      <div className="flex items-center gap-3">
        {iconName && <GameIcon iconName={iconName} size={18} className={accentColor} />}
        <span className="font-black text-sm uppercase italic tracking-widest">{title}</span>
      </div>

      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
        {/* Placeholder for user avatar or profile icon */}
        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
      </div>
    </nav>
  )
}
