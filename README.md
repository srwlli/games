# Games Collection

A collection of classic arcade games built with Next.js, React, and TypeScript.

## Overview

This project features multiple playable games including:
- **Tetris** - Modern Tetris implementation with lock delay, wall kicks, and hold piece
- **Memory Match** - Card matching memory game
- **Pick Up Sticks** - Strategy puzzle game
- **Reflex Tapper** - Advanced reaction training game with dynamic rules, adaptive difficulty, and multiple modes
- **Fishing** - Interactive fishing game

## Quick Stats

| Metric | Value |
|--------|-------|
| Dependencies | 60 |
| Games | 5 |
| Framework | Next.js 14+ |

## Quick Start

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
```

## Games

### Tetris

A fully-featured Tetris implementation with:

- **Modern Mechanics**: Lock delay (Infinity), wall kicks (SRS-Lite), hold piece
- **Performance**: Memoized rendering, optimized collision detection
- **Accessibility**: Full ARIA support, keyboard navigation, reduced motion
- **Mobile Support**: Touch gestures and on-screen controls
- **Visual Feedback**: Line clear animations, score popups, ghost piece preview

**Controls:**
- Keyboard: Arrow keys / WASD (move/rotate), Space (hard drop), C (hold), P (pause)
- Touch: Tap (rotate), Swipe (move), Swipe down (hard drop)
- Mobile: On-screen D-pad and buttons

See [Tetris Engine Documentation](lib/tetris/README.md) for technical details.

### Reflex Tapper

An advanced reaction training game featuring:

- **Dynamic Rule Phases**: Instructions change mid-game (tap any, tap color, avoid color)
- **Multiple Game Modes**: Classic (20s), Sudden Death (60s, 1 mistake), Burst (5s fast-paced)
- **Adaptive Difficulty**: Automatically adjusts spawn rate and visibility based on accuracy
- **Power-ups**: Extra time, slow motion, double score bonuses
- **Performance Tracking**: Reaction time tracking, streaks, combo multipliers
- **Accessibility**: Full ARIA support, keyboard navigation, color-blind patterns, reduced motion
- **Persistence**: Best scores and stats saved locally

**Controls:**
- Click or tap targets to score points
- Follow changing rules displayed during gameplay
- Press P or Escape to pause
- Use Enter/Space on focused targets for keyboard play

## Documentation

- [API Reference](coderef/foundation-docs/API.md)
- [Architecture](coderef/foundation-docs/ARCHITECTURE.md)
- [Components](coderef/foundation-docs/COMPONENTS.md)
- [Schema](coderef/foundation-docs/SCHEMA.md)
- [Tetris Engine](lib/tetris/README.md)

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: React 18+, Tailwind CSS
- **Animations**: Framer Motion
- **Type Safety**: TypeScript
- **State Management**: React Hooks

---

*Last Updated: 2026-01-11*