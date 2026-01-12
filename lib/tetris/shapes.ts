import type { TetrominoShape, ShapeKey } from "./types"
import { CellType } from "./types"

export const SHAPES: Record<ShapeKey, TetrominoShape> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    cellType: CellType.I,
  },
  O: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    cellType: CellType.O,
  },
  T: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    cellType: CellType.T,
  },
  S: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    cellType: CellType.S,
  },
  Z: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    cellType: CellType.Z,
  },
  J: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
    ],
    cellType: CellType.J,
  },
  L: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
    ],
    cellType: CellType.L,
  },
}

export const getRandomPieceType = (): ShapeKey => {
  const shapes = Object.keys(SHAPES) as ShapeKey[]
  return shapes[Math.floor(Math.random() * shapes.length)]
}
