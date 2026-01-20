"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { FlashCardsEngine } from '@/lib/math-games/flash-cards/engine';
import { GameState, SessionStats } from '@/lib/math-games/flash-cards/types';

export function useFlashCards() {
  const engineRef = useRef<FlashCardsEngine | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [input, setInput] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize engine once
  if (!engineRef.current) {
    engineRef.current = new FlashCardsEngine();
  }

  const syncState = useCallback(() => {
    if (engineRef.current) {
      setState(engineRef.current.getState());
      setStats(engineRef.current.getStats());
    }
  }, []);

  useEffect(() => {
    syncState();
  }, [syncState]);

  // Pre-round countdown logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished
      setCountdown(null);
      engineRef.current?.startGame();
      syncState();
    }
  }, [countdown, syncState]);

  // Game loop for timer
  useEffect(() => {
    if (state?.status !== 'playing' || countdown !== null) return;

    const timer = setInterval(() => {
      engineRef.current?.tick();
      syncState();
    }, 1000);

    return () => clearInterval(timer);
  }, [state?.status, countdown, syncState]);

  const startCountdown = useCallback(() => {
    setInput('');
    setCountdown(3);
  }, []);

  const startGame = useCallback(() => {
    engineRef.current?.startGame();
    setInput('');
    syncState();
  }, [syncState]);

  const submitAnswer = useCallback(() => {
    if (!input || state?.status !== 'playing') return;
    
    try {
      engineRef.current?.submitAnswer(input);
      setInput('');
      syncState();
    } catch (e) {
      console.error(e);
    }
  }, [input, state?.status, syncState]);

  const addDigit = useCallback((digit: string) => {
    if (state?.status !== 'playing') return;
    setInput(prev => prev + digit);
  }, [state?.status]);

  const deleteDigit = useCallback(() => {
    setInput(prev => prev.slice(0, -1));
  }, []);

  // Auto-submit if answer is correct length?
  // For now, manual submit via keypad or enter key

  return {
    state,
    stats,
    input,
    countdown,
    startCountdown,
    startGame,
    submitAnswer,
    addDigit,
    deleteDigit,
  };
}
