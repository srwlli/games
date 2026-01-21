"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFlashCards } from "@/hooks/use-flash-cards"
import MathKeypad from "./shared/math-keypad"
import { StatsBar, GameOverModal, StartScreen, CountdownOverlay } from "./shared"
import { Calculator, Zap } from "lucide-react"

export default function MathFlashCards() {
  const { state, stats, input, countdown, startCountdown, startGame, submitAnswer, addDigit, deleteDigit } = useFlashCards()
  const [showTypeBanner, setShowTypeBanner] = useState(false)

  // Show a banner when the problem type changes
  useEffect(() => {
    if (state?.currentProblem?.type) {
      setShowTypeBanner(true)
      const timer = setTimeout(() => setShowTypeBanner(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [state?.currentProblem?.type])

  if (!state) return null

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 bg-zinc-950 text-white font-sans overflow-hidden">
      {/* HUD */}
      <div className="w-full max-w-md">
        <StatsBar
          stats={[
            { label: "Score", value: state.score, color: "emerald" },
            { label: "Combo", value: state.combo, color: "purple" },
            { label: "Time", value: state.timeLeft, color: state.timeLeft < 10 ? "red" : "white" },
          ]}
        />
      </div>

      <AnimatePresence mode="wait">
        {state.status === "idle" && countdown === null && (
          <StartScreen
            key="start"
            title="Fast-Track Flash Cards"
            description="Master multiplication and division in a 60-second sprint."
            onStart={startCountdown}
            accentColor="emerald"
          />
        )}

        {state.status === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow w-full max-w-md flex flex-col items-center justify-around py-4 sm:py-8"
          >
            {/* Type Banner */}
            <AnimatePresence>
              {showTypeBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-20 sm:top-24 z-50 bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full backdrop-blur-md"
                >
                  <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">
                    {state.currentProblem?.type.replace("_", " ")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Flash Card */}
            <motion.div
              key={state.currentProblem?.id}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              className="relative w-full aspect-[4/3] max-h-[30vh] sm:max-h-none bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-zinc-800 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
            >
              {/* Heat Mode Background */}
              {state.multiplier > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  className="absolute inset-0 bg-emerald-500 blur-3xl"
                />
              )}

              <div className="text-5xl sm:text-7xl font-black italic tracking-tighter mb-2 sm:mb-4">
                {state.currentProblem?.display}
              </div>
              
              {/* Input Display */}
              <div className="h-12 sm:h-16 flex items-center justify-center">
                <div className="text-3xl sm:text-4xl font-mono text-white bg-zinc-800 px-4 sm:px-6 py-1 sm:py-2 rounded-xl border border-zinc-700 min-w-[3ch] text-center">
                  {input || "?"}
                </div>
              </div>

              {/* Multiplier Badge */}
              {state.multiplier > 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-emerald-500 text-zinc-950 text-[10px] sm:text-xs font-black px-2 sm:px-3 py-1 rounded-full uppercase italic"
                >
                  {state.multiplier}x Multiplier
                </motion.div>
              )}
            </motion.div>

            {/* Mobile Keypad */}
            <MathKeypad
              onNumber={addDigit}
              onDelete={deleteDigit}
              onSubmit={submitAnswer}
              className="w-full mt-4 sm:mt-8"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Overlay - Rendered LAST to be on top */}
      <CountdownOverlay count={countdown} accentColor="emerald" />

      <GameOverModal
        isOpen={state.status === "gameover"}
        title="Sprint Complete!"
        score={state.score}
        accentColor="emerald"
        onPlayAgain={startCountdown}
        additionalContent={
          <div className="mt-6 space-y-2 text-center">
            <p className="text-zinc-400">Accuracy: {Math.round(stats?.accuracy || 0)}%</p>
            <p className="text-zinc-400">Correct: {stats?.correctCount || 0} / {stats?.totalAnswered || 0}</p>
          </div>
        }
      />
    </div>
  )
}


