import { MathProblem, ProblemType } from './types';
import { FLASH_CARDS_CONFIG } from './config';

export class ProblemGenerator {
  private missedFacts: Map<string, number> = new Map();

  constructor() {}

  /**
   * Tracks a missed fact to increase its weight in future generation
   */
  public trackMiss(problem: MathProblem) {
    const key = this.getFactKey(problem.factors[0], problem.factors[1]);
    const currentWeight = this.missedFacts.get(key) || 0;
    this.missedFacts.set(key, currentWeight + 1);
  }

  /**
   * Generates a new problem based on 4th grade standards
   */
  public generate(allowedTypes: ProblemType[] = ['multiplication', 'division']): MathProblem {
    const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    
    // Choose factors, potentially biased towards missed facts
    const factors = this.selectFactors();
    const [a, b] = factors;

    switch (type) {
      case 'division':
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: 'division',
          text: `${a * b} ÷ ${a}`,
          display: `${a * b} ÷ ${a}`,
          answer: b,
          factors: [a, b],
        };
      case 'missing_factor':
        const isFirstMissing = Math.random() > 0.5;
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: 'missing_factor',
          text: isFirstMissing ? `? × ${b} = ${a * b}` : `${a} × ? = ${a * b}`,
          display: isFirstMissing ? `? × ${b} = ${a * b}` : `${a} × ? = ${a * b}`,
          answer: isFirstMissing ? a : b,
          factors: [a, b],
        };
      case 'multiplication':
      default:
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: 'multiplication',
          text: `${a} × ${b}`,
          display: `${a} × ${b}`,
          answer: a * b,
          factors: [a, b],
        };
    }
  }

  private selectFactors(): [number, number] {
    // 20% chance to pick from missed facts if available
    if (this.missedFacts.size > 0 && Math.random() < 0.2) {
      const keys = Array.from(this.missedFacts.keys());
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const [a, b] = randomKey.split(':').map(Number);
      return [a, b];
    }

    // Otherwise, generate random factors within range
    // 4th grade usually focuses on 0-12
    const a = Math.floor(Math.random() * (FLASH_CARDS_CONFIG.FACT_RANGES.MAX - FLASH_CARDS_CONFIG.FACT_RANGES.MIN + 1)) + FLASH_CARDS_CONFIG.FACT_RANGES.MIN;
    const b = Math.floor(Math.random() * (FLASH_CARDS_CONFIG.FACT_RANGES.MAX - FLASH_CARDS_CONFIG.FACT_RANGES.MIN + 1)) + FLASH_CARDS_CONFIG.FACT_RANGES.MIN;
    
    return [a, b];
  }

  private getFactKey(a: number, b: number): string {
    // Store in consistent order so 7x8 and 8x7 are the same fact
    const [min, max] = [a, b].sort((x, y) => x - y);
    return `${min}:${max}`;
  }
}
