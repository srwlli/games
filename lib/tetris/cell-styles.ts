import { CellType } from "./types"

/**
 * Map semantic cell types to CSS classes
 * This decouples styling from game logic
 */
export const CELL_STYLES: Record<CellType, string> = {
  [CellType.EMPTY]: "",
  [CellType.I]: "bg-cyan-500",
  [CellType.O]: "bg-yellow-500",
  [CellType.T]: "bg-purple-500",
  [CellType.S]: "bg-green-500",
  [CellType.Z]: "bg-red-500",
  [CellType.J]: "bg-blue-500",
  [CellType.L]: "bg-orange-500",
}

/**
 * Get CSS class for a cell type
 */
export function getCellStyle(cellType: CellType | null): string {
  if (cellType === null) return ""
  return CELL_STYLES[cellType] || ""
}

/**
 * Map ShapeKey to CellType
 */
export function shapeKeyToCellType(shapeKey: string): CellType {
  const mapping: Record<string, CellType> = {
    I: CellType.I,
    O: CellType.O,
    T: CellType.T,
    S: CellType.S,
    Z: CellType.Z,
    J: CellType.J,
    L: CellType.L,
  }
  return mapping[shapeKey] || CellType.EMPTY
}
