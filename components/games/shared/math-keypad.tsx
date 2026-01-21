"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Delete, Check } from "lucide-react"

interface MathKeypadProps {
  onNumber: (num: string) => void
  onDelete: () => void
  onSubmit: () => void
  className?: string
}

export default function MathKeypad({ onNumber, onDelete, onSubmit, className = "" }: MathKeypadProps) {
  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <div className={`grid grid-cols-3 gap-2 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 ${className}`}>
      {numbers.slice(0, 9).map((num) => (
        <Button
          key={num}
          variant="outline"
          className="h-12 sm:h-16 text-xl sm:text-2xl font-black bg-zinc-950/50 hover:bg-emerald-500 hover:text-zinc-950 transition-colors border-zinc-800"
          onClick={() => onNumber(num)}
        >
          {num}
        </Button>
      ))}
      <Button
        variant="outline"
        className="h-12 sm:h-16 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 border-zinc-800"
        onClick={onDelete}
      >
        <Delete size={20} className="sm:w-6 sm:h-6" />
      </Button>
      <Button
        variant="outline"
        className="h-12 sm:h-16 text-xl sm:text-2xl font-black bg-zinc-950/50 hover:bg-emerald-500 hover:text-zinc-950 transition-colors border-zinc-800"
        onClick={() => onNumber("0")}
      >
        0
      </Button>
      <Button
        variant="outline"
        className="h-12 sm:h-16 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 border-zinc-800"
        onClick={onSubmit}
      >
        <Check size={20} className="sm:w-6 sm:h-6" />
      </Button>
    </div>
  )
}
