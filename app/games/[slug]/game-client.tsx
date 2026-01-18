"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Gamepad2 } from "lucide-react"
import type { GAMES_REGISTRY } from "@/lib/games-registry"
import { useGameSession } from "@/hooks/use-game-session"

type GameData = (typeof GAMES_REGISTRY)[keyof typeof GAMES_REGISTRY]

export default function GameClient({ gameData }: { gameData: GameData }) {
  const ActiveGame = gameData.component
  const { startSession, endSession } = useGameSession()

  // Start session when game mounts
  useEffect(() => {
    startSession(gameData.id, {
      title: gameData.title,
      category: gameData.category,
    })

    // End session when component unmounts (user exits game)
    return () => {
      endSession()
    }
  }, [gameData.id, gameData.title, gameData.category, startSession, endSession])

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col h-screen overflow-hidden">
      {/* Platform Navigation Bar */}
      <nav className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-bold uppercase tracking-tighter">Exit</span>
        </Link>

        <div className="flex items-center gap-3">
          <Gamepad2 size={18} className="text-emerald-500" />
          <span className="font-black text-sm uppercase italic tracking-widest">{gameData.title}</span>
        </div>

        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700" />
      </nav>

      {/* Game Viewport */}
      <main className="flex-grow relative w-full overflow-hidden flex items-center justify-center bg-black">
        <div className="w-full h-full max-w-2xl mx-auto shadow-2xl relative">
          <ActiveGame />
        </div>
      </main>
    </div>
  )
}
