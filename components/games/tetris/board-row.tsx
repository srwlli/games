"use client"

import { memo } from "react"
import { BoardCell } from "./board-cell"
import { CellType } from "@/lib/tetris/types"

interface BoardRowProps {
  row: (CellType | null)[]
  rowIndex: number
  currentPiece: {
    shape: number[][]
    x: number
    y: number
    cellType: CellType
  }
  ghostY: number
}

export const BoardRow = memo(function BoardRow({ row, rowIndex, currentPiece, ghostY }: BoardRowProps) {
  return (
    <div className="flex">
      {row.map((cell, x) => {
        // Check if this cell is part of ghost piece
        let isGhost = false
        for (let py = 0; py < currentPiece.shape.length; py++) {
          for (let px = 0; px < currentPiece.shape[py].length; px++) {
            if (
              currentPiece.shape[py][px] &&
              ghostY + py === rowIndex &&
              currentPiece.x + px === x &&
              !cell
            ) {
              isGhost = true
            }
          }
        }

        return (
          <BoardCell
            key={x}
            cell={cell}
            isGhost={isGhost}
            ghostCellType={isGhost ? currentPiece.cellType : undefined}
          />
        )
      })}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  if (prevProps.rowIndex !== nextProps.rowIndex) return false
  if (prevProps.ghostY !== nextProps.ghostY) return false
  if (prevProps.currentPiece.x !== nextProps.currentPiece.x) return false
  if (prevProps.currentPiece.y !== nextProps.currentPiece.y) return false
  if (prevProps.currentPiece.color !== nextProps.currentPiece.color) return false
  
  // Deep compare row
  if (prevProps.row.length !== nextProps.row.length) return false
  for (let i = 0; i < prevProps.row.length; i++) {
    if (prevProps.row[i] !== nextProps.row[i]) return false
  }
  
  // Deep compare shape
  if (prevProps.currentPiece.shape.length !== nextProps.currentPiece.shape.length) return false
  for (let y = 0; y < prevProps.currentPiece.shape.length; y++) {
    if (prevProps.currentPiece.shape[y].length !== nextProps.currentPiece.shape[y].length) return false
    for (let x = 0; x < prevProps.currentPiece.shape[y].length; x++) {
      if (prevProps.currentPiece.shape[y][x] !== nextProps.currentPiece.shape[y][x]) return false
    }
  }
  
  return true
})
