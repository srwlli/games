export const FLASH_CARDS_CONFIG = {
  ROUND_DURATION: 60, // seconds
  COMBO_THRESHOLDS: {
    HEATING_UP: 5,   // multiplier 1.5x
    ON_FIRE: 10,     // multiplier 2x
  },
  FACT_RANGES: {
    MIN: 0,
    MAX: 12,
  },
  WEIGHTS: {
    NEW_PROBLEM: 1,
    MISSED_PROBLEM: 2, // 2x likely to show up again
  },
  POINTS: {
    BASE: 100,
    SPEED_BONUS_MAX: 50,
  }
};
