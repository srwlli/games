export type ProblemType = 'multiplication' | 'division' | 'missing_factor';

export interface MathProblem {
  id: string;
  type: ProblemType;
  text: string;
  answer: number;
  factors: [number, number]; // [a, b] for a * b or c / a
  display: string; // The equation to show e.g. "7 x 8" or "56 ÷ 7"
}

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'gameover';
  score: number;
  combo: number;
  multiplier: number;
  timeLeft: number;
  currentProblem: MathProblem | null;
  history: ProblemResult[];
}

export interface ProblemResult {
  problem: MathProblem;
  userAnswer: number | string;
  isCorrect: boolean;
  timeTaken: number;
  timestamp: number;
}

export interface SessionStats {
  totalAnswered: number;
  correctCount: number;
  accuracy: number;
  bestCombo: number;
  averageReactionTime: number;
  trickyFacts: string[];
}
