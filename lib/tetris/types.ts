// Tetris game types and interfaces

export type ShapeKey = "I" | "O" | "T" | "S" | "Z" | "J" | "L"

// Semantic cell value enum (instead of CSS strings)
export enum CellType {
  EMPTY = 0,
  I = 1,
  O = 2,
  T = 3,
  S = 4,
  Z = 5,
  J = 6,
  L = 7,
}

export interface TetrominoShape {
  shape: number[][]
  cellType: CellType
}

export interface Piece {
  shape: number[][]
  cellType: CellType
  x: number
  y: number
  type: ShapeKey
  rotation: number
}

// Board stores semantic cell types, not CSS strings
export type CellValue = CellType | null

export type Board = CellValue[][]

export interface GameConfig {
  boardWidth: number
  boardHeight: number
  initialFallSpeed: number
  minFallSpeed: number
  levelUpLines: number
  lockDelayMs: number
  lockDelayResets: number
  scoring: {
    single: number
    double: number
    triple: number
    tetris: number
    softDrop: number
    hardDrop: number
  }
}

export interface GameState {
  board: Board
  currentPiece: Piece
  nextPiece: Piece
  score: number
  level: number
  linesCleared: number
  fallSpeed: number
  lockDelayTimer: number | null
  lockDelayResetsRemaining: number
}

export interface GameActions {
  moveLeft: () => void
  moveRight: () => void
  moveDown: () => void
  rotate: () => void
  hardDrop: () => void
  reset: () => void
  tick: () => void
}

export interface LineClearResult {
  linesCleared: number[]
  newBoard: Board
  scoreIncrease: number
  levelIncrease: number
}
