import { DictionaryService } from '../trie/trie-service';
import { WordscapeLevel, WordscapeState, GridCell, Position } from './types';

export class WordscapeEngine {
  private dictionary = DictionaryService.getInstance();

  constructor() {}

  /**
   * Initializes the crossword grid cells based on level words
   */
  public generateGrid(level: WordscapeLevel): GridCell[][] {
    const { rows, cols } = level.gridSize;
    const grid: GridCell[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        row: r,
        col: c,
        letter: '',
        isRevealed: false,
        isPartOfWordIds: [],
      }))
    );

    level.words.forEach((wordObj) => {
      const { word, startPos, direction, id } = wordObj;
      for (let i = 0; i < word.length; i++) {
        const r = direction === 'horizontal' ? startPos.row : startPos.row + i;
        const c = direction === 'horizontal' ? startPos.col + i : startPos.col;
        
        if (r < rows && c < cols) {
          grid[r][c].letter = word[i].toUpperCase();
          if (!grid[r][c].isPartOfWordIds.includes(id)) {
            grid[r][c].isPartOfWordIds.push(id);
          }
        }
      }
    });

    return grid;
  }

  /**
   * Validates a word selection against the grid and dictionary
   */
  public validateSelection(selection: string, level: WordscapeLevel, foundWords: string[]): {
    type: 'grid' | 'bonus' | 'already_found' | 'invalid';
    wordId?: string;
  } {
    const word = selection.toUpperCase();
    
    // Check if already found
    if (foundWords.includes(word)) {
      return { type: 'already_found' };
    }

    // Check if in grid
    const gridWord = level.words.find(w => w.word.toUpperCase() === word);
    if (gridWord) {
      return { type: 'grid', wordId: gridWord.id };
    }

    // Check if in dictionary (bonus word)
    if (this.dictionary.loaded && this.dictionary.validate(word)) {
      return { type: 'bonus' };
    }

    return { type: 'invalid' };
  }

  /**
   * Gets a random unrevealed cell for a hint
   */
  public getRandomHint(grid: GridCell[][]): Position | null {
    const unrevealed: Position[] = [];
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.letter && !cell.isRevealed) {
          unrevealed.push({ row: cell.row, col: cell.col });
        }
      });
    });

    if (unrevealed.length === 0) return null;
    return unrevealed[Math.floor(Math.random() * unrevealed.length)];
  }

  /**
   * Checks if all grid words are found
   */
  public isLevelComplete(level: WordscapeLevel, foundWords: string[]): boolean {
    return level.words.every(w => foundWords.includes(w.word.toUpperCase()));
  }
}
