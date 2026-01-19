/**
 * Boggle game configuration
 */

export type TimeMode = "1min" | "1.5min" | "2min" | "3min"

export const TIME_MODES: Record<TimeMode, number> = {
  "1min": 60,
  "1.5min": 90,
  "2min": 120,
  "3min": 180,
} as const

export const BOGGLE_CONFIG = {
  GRID_SIZE: 4,
  TIME_LIMIT_SECONDS: 180, // 3 minutes (default)
  MIN_WORD_LENGTH: 3,
} as const
