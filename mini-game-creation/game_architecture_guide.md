# Games Platform - Architectural Guide

This document outlines the technical "rules of the road" for the current implementation of the games platform. These patterns ensure consistency across all mini-games and provide a foundation for future development.

## 1. Physics & Timing

### Fixed Timestep Model
The platform currently utilizes a **Fixed Timestep (Discrete)** model. 
- **Frame Rate Dependency**: Game logic is disconnected from the monitor's refresh rate. Movements and spawns are driven by discrete intervals using `setInterval` or `setTimeout` (e.g., Tetris fall speed, target spawning in Reflex Tapper).
- **Delta Time ($dt$)**: **Not implemented.** Because movements are discrete (grid-based or tick-based), a delta time variable is not passed into the update logic. This ensures that a game tick on a 60Hz screen behaves exactly the same as on a 120Hz screen.

## 2. State & Data Flow

### The "Source of Truth"
The primary mechanism for data management is **React State (`useState`)**.
- **Storage**: Player positions, health, scores, and board states are held as serializable state within the component.
- **UI Updates**: The system is fully reactive. The "engine" logic updates the React state, which triggers a shallow re-render of the Next.js UI elements. This avoids the complexity of manual DOM manipulation or separate event emitters.

## 3. Scaling & Resolution

### DOM-Based Rendering
The games are rendered using **Standard HTML/CSS (DOM)** rather than the `<canvas>` API.
- **Coordinate System**: Layouts are built using CSS Grid and Flexbox. Positions for action games (like Reflex Tapper) are calculated using **percentage-based offsets** (`left: x%`, `top: y%`), making the game "world" responsive to the container size while keeping coordinates consistent.
- **High-DPI Handling**: Native browser scaling handles Retina/4K displays. Because we aren't using a canvas context, we don't need to manually adjust for `devicePixelRatio`; elements remain crisp at any resolution.

## 4. Inputs & Controls

### Unified Event Listeners
- **Input Method**: Games react to individual **`keydown` events**. A central `useEffect` hook listens for key events on the `window` object and maps them to game actions (WASD/Arrows).
- **Mobile/Touch**: 
    - **Tapping**: standard `onClick` is sufficient for simple interactions.
    - **Gestures**: Complex games (Tetris) utilize a custom **Gesture System** that calculates swipes by comparing `onTouchStart` and `onTouchEnd` coordinates, effectively translating physical swipes into digital game movements.

## 5. Asset Management

### Zero-Weight Strategy
The current platform uses a **Native Component** approach to assets.
- **Assets**: Currently, all games use **Emojis and Tailwind CSS gradients** for game objects.
- **Loading**: This strategy ensures that games are "Start-Ready" immediately upon mounting, bypassing the need for image loaders, manifest files, or loading screens.

## 6. Next.js Specifics

### Hybrid Performance
- **Server-Side Safety**: All game instances use the `"use client"` directive. Interactions with the `window` or `document` objects are safely wrapped in **`useEffect`**, preventing errors during Next.js Server-Side Rendering (SSR).
- **Optimization**: Animations and translations are handled by **`framer-motion`**. This leverages GPU acceleration through CSS transforms (like `scale`, `rotate`, and `translate`), keeping the main thread free for game logic.
