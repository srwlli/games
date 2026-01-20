import { GameState, MathProblem, ProblemResult, SessionStats } from './types';
import { FLASH_CARDS_CONFIG } from './config';
import { ProblemGenerator } from './generator';

export class FlashCardsEngine {
  private state: GameState;
  private generator: ProblemGenerator;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.generator = new ProblemGenerator();
    this.state = this.getInitialState();
  }

  public getInitialState(): GameState {
    return {
      status: 'idle',
      score: 0,
      combo: 0,
      multiplier: 1,
      timeLeft: FLASH_CARDS_CONFIG.ROUND_DURATION,
      currentProblem: null,
      history: [],
    };
  }

  public startGame() {
    this.state = this.getInitialState();
    this.state.status = 'playing';
    this.state.currentProblem = this.generator.generate();
  }

  public submitAnswer(answer: number | string): ProblemResult {
    if (this.state.status !== 'playing' || !this.state.currentProblem) {
      throw new Error('Game is not in playing state');
    }

    const numericAnswer = typeof answer === 'string' ? parseInt(answer, 10) : answer;
    const isCorrect = numericAnswer === this.state.currentProblem.answer;
    
    const result: ProblemResult = {
      problem: this.state.currentProblem,
      userAnswer: numericAnswer,
      isCorrect,
      timeTaken: 0, // In a real implementation, we'd track timestamps
      timestamp: Date.now(),
    };

    if (isCorrect) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
      this.generator.trackMiss(this.state.currentProblem);
    }

    this.state.history.push(result);
    this.state.currentProblem = this.generator.generate();
    
    return result;
  }

  private handleCorrectAnswer() {
    this.state.combo++;
    this.updateMultiplier();
    
    const points = FLASH_CARDS_CONFIG.POINTS.BASE * this.state.multiplier;
    this.state.score += points;
  }

  private handleIncorrectAnswer() {
    this.state.combo = 0;
    this.state.multiplier = 1;
  }

  private updateMultiplier() {
    if (this.state.combo >= FLASH_CARDS_CONFIG.COMBO_THRESHOLDS.ON_FIRE) {
      this.state.multiplier = 2;
    } else if (this.state.combo >= FLASH_CARDS_CONFIG.COMBO_THRESHOLDS.HEATING_UP) {
      this.state.multiplier = 1.5;
    } else {
      this.state.multiplier = 1;
    }
  }

  public tick() {
    if (this.state.status === 'playing') {
      this.state.timeLeft--;
      if (this.state.timeLeft <= 0) {
        this.state.status = 'gameover';
      }
    }
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getStats(): SessionStats {
    const correctCount = this.state.history.filter(h => h.isCorrect).length;
    const totalAnswered = this.state.history.length;
    const accuracy = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
    
    // Find tricky facts (top 3 missed)
    const missMap = new Map<string, number>();
    this.state.history.filter(h => !h.isCorrect).forEach(h => {
      const key = `${h.problem.display} = ${h.problem.answer}`;
      missMap.set(key, (missMap.get(key) || 0) + 1);
    });

    const trickyFacts = Array.from(missMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    return {
      totalAnswered,
      correctCount,
      accuracy,
      bestCombo: 0, // Would need tracking in state
      averageReactionTime: 0, // Would need timestamps
      trickyFacts,
    };
  }
}
