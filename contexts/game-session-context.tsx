"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import type { GAMES_REGISTRY } from "@/lib/games-registry"

type GameId = keyof typeof GAMES_REGISTRY | null

export interface GameSession {
  gameId: GameId
  startTime: number | null
  endTime: number | null
  score: number | null
  metadata: Record<string, unknown>
}

export interface GameSessionContextValue {
  // Current session state
  currentGame: GameId
  isInGame: boolean
  currentSession: GameSession | null
  sessionHistory: GameSession[]

  // Session management
  startSession: (gameId: GameId, metadata?: Record<string, unknown>) => void
  endSession: (score?: number, metadata?: Record<string, unknown>) => void
  updateSession: (updates: Partial<Pick<GameSession, "score" | "metadata">>) => void

  // Analytics helpers
  getTotalGamesPlayed: () => number
  getGamesPlayedFor: (gameId: GameId) => number
  getBestScoreFor: (gameId: GameId) => number | null
  getTotalPlayTime: () => number // in milliseconds
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null)

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
  const [currentGame, setCurrentGame] = useState<GameId>(null)
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null)
  const [sessionHistory, setSessionHistory] = useState<GameSession[]>([])
  const sessionStartTimeRef = useRef<number | null>(null)

  // Load session history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("game-session-history")
      if (stored) {
        const parsed = JSON.parse(stored) as GameSession[]
        setSessionHistory(parsed)
      }
    } catch (error) {
      console.warn("Failed to load session history:", error)
    }
  }, [])

  // Save session history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("game-session-history", JSON.stringify(sessionHistory))
    } catch (error) {
      console.warn("Failed to save session history:", error)
    }
  }, [sessionHistory])

  const startSession = useCallback(
    (gameId: GameId, metadata: Record<string, unknown> = {}) => {
      const startTime = Date.now()
      sessionStartTimeRef.current = startTime

      const newSession: GameSession = {
        gameId,
        startTime,
        endTime: null,
        score: null,
        metadata,
      }

      setCurrentGame(gameId)
      setCurrentSession(newSession)
    },
    [],
  )

  const endSession = useCallback(
    (score?: number, metadata?: Record<string, unknown>) => {
      if (!currentSession || !sessionStartTimeRef.current) return

      const endTime = Date.now()
      const completedSession: GameSession = {
        ...currentSession,
        endTime,
        score: score ?? currentSession.score,
        metadata: { ...currentSession.metadata, ...metadata },
      }

      // Add to history
      setSessionHistory((prev) => {
        // Keep last 100 sessions
        const updated = [completedSession, ...prev].slice(0, 100)
        return updated
      })

      // Clear current session
      setCurrentSession(null)
      setCurrentGame(null)
      sessionStartTimeRef.current = null
    },
    [currentSession],
  )

  const updateSession = useCallback(
    (updates: Partial<Pick<GameSession, "score" | "metadata">>) => {
      if (!currentSession) return

      setCurrentSession((prev) => {
        if (!prev) return null
        return {
          ...prev,
          ...updates,
          metadata: { ...prev.metadata, ...updates.metadata },
        }
      })
    },
    [currentSession],
  )

  // Analytics helpers
  const getTotalGamesPlayed = useCallback(() => {
    return sessionHistory.length
  }, [sessionHistory])

  const getGamesPlayedFor = useCallback(
    (gameId: GameId) => {
      if (!gameId) return 0
      return sessionHistory.filter((session) => session.gameId === gameId).length
    },
    [sessionHistory],
  )

  const getBestScoreFor = useCallback(
    (gameId: GameId) => {
      if (!gameId) return null
      const gameSessions = sessionHistory.filter(
        (session) => session.gameId === gameId && session.score !== null,
      ) as Array<GameSession & { score: number }>

      if (gameSessions.length === 0) return null

      return Math.max(...gameSessions.map((session) => session.score))
    },
    [sessionHistory],
  )

  const getTotalPlayTime = useCallback(() => {
    return sessionHistory.reduce((total, session) => {
      if (session.startTime && session.endTime) {
        return total + (session.endTime - session.startTime)
      }
      return total
    }, 0)
  }, [sessionHistory])

  const value: GameSessionContextValue = {
    currentGame,
    isInGame: currentGame !== null,
    currentSession,
    sessionHistory,
    startSession,
    endSession,
    updateSession,
    getTotalGamesPlayed,
    getGamesPlayedFor,
    getBestScoreFor,
    getTotalPlayTime,
  }

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>
}

export function useGameSession() {
  const context = useContext(GameSessionContext)
  if (!context) {
    throw new Error("useGameSession must be used within a GameSessionProvider")
  }
  return context
}
