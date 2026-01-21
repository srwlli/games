import { WordscapeLevel } from './types';

export const WORDSCAPE_LEVELS: WordscapeLevel[] = [
  {
    id: 1,
    letters: ['A', 'C', 'T'],
    gridSize: { rows: 3, cols: 3 },
    words: [
      { id: 'w1', word: 'CAT', startPos: { row: 0, col: 0 }, direction: 'vertical', found: false },
      { id: 'w2', word: 'ACT', startPos: { row: 1, col: 0 }, direction: 'horizontal', found: false },
    ],
  },
  {
    id: 2,
    letters: ['A', 'R', 'T'],
    gridSize: { rows: 4, cols: 4 },
    words: [
      { id: 'w1', word: 'ART', startPos: { row: 0, col: 1 }, direction: 'vertical', found: false },
      { id: 'w2', word: 'RAT', startPos: { row: 1, col: 0 }, direction: 'horizontal', found: false },
      { id: 'w3', word: 'TAR', startPos: { row: 1, col: 2 }, direction: 'vertical', found: false },
    ],
  },
  {
    id: 3,
    letters: ['D', 'O', 'G', 'S'],
    gridSize: { rows: 5, cols: 5 },
    words: [
      { id: 'w1', word: 'DOGS', startPos: { row: 0, col: 2 }, direction: 'vertical', found: false },
      { id: 'w2', word: 'GOD', startPos: { row: 2, col: 0 }, direction: 'horizontal', found: false },
      { id: 'w3', word: 'DOG', startPos: { row: 0, col: 2 }, direction: 'horizontal', found: false },
    ],
  },
  {
    id: 4,
    letters: ['O', 'P', 'E', 'N'],
    gridSize: { rows: 5, cols: 5 },
    words: [
      { id: 'w1', word: 'OPEN', startPos: { row: 1, col: 0 }, direction: 'horizontal', found: false },
      { id: 'w2', word: 'PONE', startPos: { row: 0, col: 1 }, direction: 'vertical', found: false },
      { id: 'w3', word: 'PEN', startPos: { row: 0, col: 1 }, direction: 'horizontal', found: false },
      { id: 'w4', word: 'ONE', startPos: { row: 1, col: 3 }, direction: 'vertical', found: false },
    ],
  },
];
