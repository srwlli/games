"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GameOverModal, UnifiedHUD } from "@/components/games/shared"
import { useGameState } from "@/hooks/use-game-state"
import { useGameSessionIntegration } from "@/hooks/use-game-session-integration"

// Tiers of crystals for merging
const CRYSTAL_TIERS = [
    { level: 1, name: "Dust Shard", emoji: "🪨", color: "from-zinc-400 to-zinc-600", points: 10 },
    { level: 2, name: "Crystal Pebble", emoji: "💎", color: "from-cyan-300 to-cyan-500", points: 25 },
    { level: 3, name: "Glowing Ore", emoji: "✨", color: "from-emerald-300 to-emerald-500", points: 60 },
    { level: 4, name: "Raw Sapphire", emoji: "🔷", color: "from-blue-400 to-blue-600", points: 150 },
    { level: 5, name: "Emerald Flame", emoji: "❇️", color: "from-green-400 to-green-600", points: 400 },
    { level: 6, name: "Ruby Spark", emoji: "🔥", color: "from-red-400 to-red-600", points: 1000 },
    { level: 7, name: "Thunder Stone", emoji: "⚡", color: "from-yellow-300 to-yellow-500", points: 2500 },
    { level: 8, name: "Astral Void", emoji: "🌌", color: "from-purple-500 to-purple-700", points: 6000 },
    { level: 9, name: "Solar Flare", emoji: "🌞", color: "from-orange-400 to-red-500", points: 15000 },
    { level: 10, name: "Zen Infinity", emoji: "🧘", color: "from-indigo-500 via-purple-500 to-pink-500", points: 50000 },
]

interface Crystal {
    id: string
    level: number
}

export default function ZenMerge() {
    const [grid, setGrid] = useState<(Crystal | null)[]>(Array(16).fill(null))
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [discoveredLevels, setDiscoveredLevels] = useState<number>(1)
    const [notification, setNotification] = useState<string | null>(null)

    const { isPlaying, isPaused, isGameOver, gameOver, reset, start } = useGameState({
        initialState: "playing",
    })

    const { updateScore, liveTime } = useGameSessionIntegration("zen-merge")

    // Initialize game
    const resetGame = useCallback(() => {
        setGrid(Array(16).fill(null))
        setScore(0)
        setDiscoveredLevels(1)
        setNotification(null)
        reset()
        start()

        // Spawn initial items
        const startGrid = Array(16).fill(null)
        const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].sort(() => Math.random() - 0.5)
        startGrid[indices[0]] = { id: Math.random().toString(), level: 1 }
        startGrid[indices[1]] = { id: Math.random().toString(), level: 1 }
        setGrid(startGrid)
    }, [reset, start])

    useEffect(() => {
        resetGame()
    }, [resetGame])

    const spawnCrystal = (currentGrid: (Crystal | null)[], atIndex?: number) => {
        const newGrid = [...currentGrid]

        // If a specific index is provided and empty, spawn there
        if (atIndex !== undefined && atIndex >= 0 && atIndex < 16 && newGrid[atIndex] === null) {
            newGrid[atIndex] = { id: Math.random().toString(), level: 1 }
            return newGrid
        }

        // Otherwise, spawn at a random empty index
        const emptyIndices = currentGrid
            .map((cell, index) => (cell === null ? index : null))
            .filter((index): index is number => index !== null)

        if (emptyIndices.length === 0) return currentGrid

        const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
        newGrid[randomIndex] = { id: Math.random().toString(), level: 1 }
        return newGrid
    }

    const handleTileClick = (index: number) => {
        if (!isPlaying || isPaused || isGameOver) return

        if (grid[index] === null) {
            // Spawn EXACTLY where the user clicked
            const newGrid = spawnCrystal(grid, index)
            setGrid(newGrid)

            // Check for Game Over (Full Grid)
            if (newGrid.filter(c => c === null).length === 0) {
                // Practically game over if no merges possible, but let player try to move
            }
        }
    }

    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (!grid[index]) return
        setDraggedIndex(index)

        // Set a custom drag image or transparent
        const img = new Image()
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        e.dataTransfer.setDragImage(img, 0, 0)
    }

    const handleDrop = (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null)
            return
        }

        const sourceCrystal = grid[draggedIndex]
        const targetCrystal = grid[targetIndex]

        if (!sourceCrystal) return

        let newGrid = [...grid]

        if (targetCrystal && targetCrystal.level === sourceCrystal.level && sourceCrystal.level < 10) {
            // MERGE!
            const nextLevel = sourceCrystal.level + 1
            const points = CRYSTAL_TIERS[nextLevel - 1].points

            newGrid[targetIndex] = { id: Math.random().toString(), level: nextLevel }
            newGrid[draggedIndex] = null

            const newScore = score + points
            setScore(newScore)
            updateScore(newScore)
            if (newScore > highScore) setHighScore(newScore)

            if (nextLevel > discoveredLevels) {
                setDiscoveredLevels(nextLevel)
                setNotification(`New Discovery: ${CRYSTAL_TIERS[nextLevel - 1].name}!`)
                setTimeout(() => setNotification(null), 3000)
            }
            // NO AUTO-SPAWN: Merging rewards you with space.
        } else {
            // MOVE or SWAP
            newGrid[targetIndex] = sourceCrystal
            newGrid[draggedIndex] = targetCrystal // targetCrystal is null if empty, effectively moving it
        }

        setGrid(newGrid)
        setDraggedIndex(null)

        // Check for "Deadlock"
        // 1. Is the grid full?
        const isFull = newGrid.every(c => c !== null)
        if (!isFull) return

        // 2. Are there ANY merges possible on the whole board? (Global Check)
        const levelCounts: Record<number, number> = {}
        newGrid.forEach(c => {
            if (c) levelCounts[c.level] = (levelCounts[c.level] || 0) + 1
        })

        const hasAnyPossibleMerge = Object.values(levelCounts).some(count => count >= 2)

        if (!hasAnyPossibleMerge) {
            gameOver()
        }
    }

    return (
        <div className="w-full h-full bg-gradient-to-br from-zinc-950 to-indigo-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
            <UnifiedHUD
                stats={[
                    { label: "Score", value: score, color: "cyan" },
                    { label: "High Score", value: highScore, color: "amber" },
                    { label: "Time", value: Math.floor(liveTime / 1000) + "s", color: "orange" },
                ]}
                className="absolute top-20 left-0 right-0 z-10"
            />

            <div className="w-full max-w-md p-6 space-y-6">
                <div className="text-center">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-1">ZEN MERGE</h2>
                    <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Merge shards to reach Infinity</p>
                </div>

                {/* Grid Container */}
                <div className="aspect-square w-full bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] p-4 border-4 border-zinc-800/50 shadow-2xl relative">
                    <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full">
                        {grid.map((crystal, i) => (
                            <div
                                key={i}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(i)}
                                onClick={() => handleTileClick(i)}
                                className={`relative rounded-2xl flex items-center justify-center transition-all duration-200 border-2 ${crystal ? "bg-zinc-800 border-zinc-700 shadow-lg" : "bg-zinc-900/30 border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
                                    } ${draggedIndex === i ? "opacity-0" : "opacity-100"}`}
                            >
                                <AnimatePresence>
                                    {crystal && (
                                        <motion.div
                                            layoutId={crystal.id}
                                            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                            exit={{ scale: 1.5, opacity: 0 }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, i)}
                                            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing p-2"
                                        >
                                            <div className={`w-full h-full rounded-xl bg-gradient-to-br ${CRYSTAL_TIERS[crystal.level - 1].color} flex items-center justify-center text-3xl shadow-lg relative group`}>
                                                {/* Glow effect */}
                                                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {CRYSTAL_TIERS[crystal.level - 1].emoji}

                                                {/* Level Badge */}
                                                <div className="absolute -bottom-1 -right-1 bg-black/60 text-[10px] px-1.5 rounded-md font-black text-white border border-white/20">
                                                    {crystal.level}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center h-4">
                    <AnimatePresence>
                        {notification && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]"
                            >
                                {notification}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    {!notification && (
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            {grid.filter(c => c === null).length > 0 ? "Tap empty tile to spawn shard" : "OUT OF SPACE! Merge items!"}
                        </p>
                    )}
                </div>

                {/* Discovered Tiers Progress */}
                <div className="pt-4 border-t border-zinc-800/50">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Discovery Progress</span>
                        <span className="text-zinc-400 text-[10px] font-black">{Math.round((discoveredLevels / 10) * 100)}%</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
                        {CRYSTAL_TIERS.map((tier) => (
                            <div
                                key={tier.level}
                                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-500 ${discoveredLevels >= tier.level
                                    ? `bg-gradient-to-br ${tier.color} shadow-lg opacity-100`
                                    : "bg-zinc-900 border border-zinc-800 opacity-20 grayscale"
                                    }`}
                            >
                                {tier.emoji}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <GameOverModal
                isOpen={isGameOver}
                title="INFINITY REACHED?"
                score={score}
                scoreLabel="Final Zen Score"
                accentColor="indigo"
                onPlayAgain={resetGame}
            />
        </div>
    )
}
