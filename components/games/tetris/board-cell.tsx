"use client"

import { memo } from "react"
import { CellType } from "@/lib/tetris/types"
import { getCellStyle } from "@/lib/tetris/cell-styles"

interface BoardCellProps {
  cell: CellType | null
  isGhost: boolean
  ghostCellType?: CellType
}

export const BoardCell = memo(function BoardCell({ cell, isGhost, ghostCellType }: BoardCellProps) {
  const cellType = isGhost ? ghostCellType : cell
  const cellStyle = getCellStyle(cellType)
  const opacity = isGhost ? "opacity-30" : ""
  const borderStyle = isGhost ? "border-2 border-zinc-400 border-dashed" : "border border-zinc-800"

  return (
    <div className={`w-6 h-6 ${borderStyle} ${cellStyle} ${opacity}`} />
  )
})
