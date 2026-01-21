"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Gamepad2 } from "lucide-react"
import type { GAMES_REGISTRY } from "@/lib/games-registry"
import { useGameSession } from "@/hooks/use-game-session"
import { GamePlatformHeader } from "@/components/games/shared"

type GameData = (typeof GAMES_REGISTRY)[keyof typeof GAMES_REGISTRY]

export default function WipGameClient({ gameData }: { gameData: GameData }) {
  const ActiveGame = gameData.component
  const { startSession, endSession } = useGameSession()
  
  // Store endSession in ref to ensure stable reference for cleanup
  const endSessionRef = useRef(endSession)
  endSessionRef.current = endSession

  // Start session when game mounts
  useEffect(() => {
    startSession(gameData.id, {
      title: gameData.title,
      category: gameData.category,
    })

    // End session when component unmounts (user exits game)
    return () => {
      endSessionRef.current()
    }
  }, [gameData.id, startSession]) // startSession is stable, endSession handled via ref

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col h-screen overflow-hidden">
      {/* Platform Navigation Bar */}
      <GamePlatformHeader
        title={gameData.title}
        backHref="/work-in-progress"
        backLabel="Back to Work In Progress"
        iconName={gameData.thumbnail}
        accentColor="text-emerald-500"
      />

      {/* Game Viewport */}
      <main 
        className="flex-grow relative w-full overflow-hidden flex items-center justify-center bg-black"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="w-full h-full max-w-2xl mx-auto shadow-2xl relative">
          <ActiveGame />
        </div>
      </main>
    </div>
  )
}
