"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Trophy, Play } from "lucide-react"
import { GAMES_REGISTRY } from "@/lib/games-registry"

export default function GameDashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-20 font-sans">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 mt-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
            Game<span className="text-emerald-500">Hub</span>
          </h1>
          <p className="text-zinc-500 mt-2 font-medium uppercase tracking-widest text-xs">Modern Touch Repository</p>
        </div>
        <div className="hidden sm:block">
          <div className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-3">
            <Trophy className="text-yellow-500 w-4 h-4" />
            <span className="text-sm font-bold">Leaderboard</span>
          </div>
        </div>
      </header>

      {/* Game Grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Word Games Card */}
        <Link href="/word-games">
          <motion.div
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -5 }}
            className="group relative h-64 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-colors"
          >
            {/* Card Visual */}
            <div className="absolute inset-0 opacity-20 bg-blue-500 blur-3xl group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center text-7xl select-none">
              📝
            </div>

            {/* Card Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent">
              <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-500 uppercase mb-1">
                Category
              </span>
              <h3 className="text-2xl font-black text-white">Word Games</h3>
              <p className="text-zinc-400 text-sm line-clamp-1 mb-4">Challenge your vocabulary and word skills.</p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-white">
                <div className="bg-emerald-500 rounded-full p-1">
                  <Play size={12} fill="currentColor" className="text-zinc-950" />
                </div>
                Explore
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Individual Game Cards - Exclude Word Games (they're in /word-games) */}
        {Object.values(GAMES_REGISTRY)
          .filter((game) => game.category !== "Word Game")
          .map((game) => (
            <Link href={`/games/${game.id}`} key={game.id}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -5 }}
              className="group relative h-64 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-colors"
            >
              {/* Card Visual */}
              <div
                className={`absolute inset-0 opacity-20 ${game.color} blur-3xl group-hover:opacity-40 transition-opacity`}
              />
              <div className="absolute inset-0 flex items-center justify-center text-7xl select-none">
                {game.thumbnail}
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
