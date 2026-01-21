export type WordDirection = 'horizontal' | 'vertical';

export interface Position {
  row: number;
  col: number;
}

export interface WordInGrid {
  id: string;
  word: string;
  startPos: Position;
  direction: WordDirection;
  found: boolean;
}

export interface WordscapeLevel {
  id: number;
  letters: string[]; // e.g. ["A", "R", "T"]
  words: WordInGrid[];
  gridSize: { rows: number; cols: number };
}

export interface WordscapeState {
  status: 'idle' | 'playing' | 'level_complete' | 'game_over';
  currentLevelIndex: number;
  currentLevel: WordscapeLevel | null;
  foundWords: string[]; // words found that are in the grid
  bonusWords: string[]; // words found that are NOT in the grid but in dictionary
  currentSelection: string; // letters currently being swiped
  revealedCells: Position[]; // positions revealed by hints
  score: number;
  combo: number;
}

export interface GridCell {
  row: number;
  col: number;
  letter: string;
  isRevealed: boolean;
  isPartOfWordIds: string[];
}
