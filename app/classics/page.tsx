"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Play } from "lucide-react"
import { GAMES_REGISTRY } from "@/lib/games-registry"
import { GameIcon } from "@/lib/game-icons"

export default function ClassicsPage() {
  // Filter games by "Classic" category
  const classicGames = Object.values(GAMES_REGISTRY).filter((game) => game.category === "Classic")

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-20 font-sans">
      {/* Game Grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classicGames.map((game) => (
          <Link href={`/classics/${game.id}`} key={game.id}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -5 }}
              className="group relative h-64 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-colors"
            >
              {/* Card Visual */}
              <div
                className={`absolute inset-0 opacity-20 ${game.color} blur-3xl group-hover:opacity-40 transition-opacity`}
              />
              <div className="absolute inset-0 flex items-center justify-center select-none">
                <GameIcon iconName={game.thumbnail} size={80} className="text-white/80" />
              </div>

              {/* Card Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent">
                <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-500 uppercase mb-1">
                  {game.category}
                </span>
                <h3 className="text-2xl font-black text-white">{game.title}</h3>
                <p className="text-zinc-400 text-sm line-clamp-1 mb-4">{game.description}</p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-white">
                  <div className="bg-emerald-500 rounded-full p-1">
                    <Play size={12} fill="currentColor" className="text-zinc-950" />
                  </div>
                  Play Now
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </main>
    </div>
  )
}
