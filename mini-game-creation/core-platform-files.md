# Core Platform Files

To understand how the mini-games platform works or to add new features, these are the most critical files you should know:

## 1. The Registry
### [games-registry.tsx](file:///c:/Users/willh/Desktop/games/lib/games-registry.tsx)
This is the **Source of Truth** for all games on the platform. 
- **Purpose**: It maps game IDs (slugs) to their React components, titles, and metadata.
- **When to use**: Whenever you add a new game or want to change how a game is listed on the dashboard.

## 2. Dynamic Routing
### [app/games/[slug]/game-client.tsx](file:///c:/Users/willh/Desktop/games/app/games/[slug]/game-client.tsx)
This file handles the actual loading of games.
- **Purpose**: It reads the `slug` from the URL, looks it up in the `GAMES_REGISTRY`, and mounts the correct component.
- **When to use**: If you need to change how games are mounted or add global game wrappers (like a universal "Quit" button).

## 3. The Dashboard
### [app/page.tsx](file:///c:/Users/willh/Desktop/games/app/page.tsx)
The entry point for users.
- **Purpose**: Displays the grid of available games by iterating through the `GAMES_REGISTRY`.
- **When to use**: If you want to change the visual layout of the game selection screen.

## 4. Game Implementation Folder
### [components/games/](file:///c:/Users/willh/Desktop/games/components/games/)
The directory containing all individual game logic.
- **Key Files**: `tetris.tsx`, `memory-match.tsx`, `pick-up-sticks.tsx`, `reflex-tapper.tsx`.
- **Purpose**: These are the standalone React components for each game.
- **When to use**: To modify game logic, physics, or visuals for a specific game.

## 5. Global Styles & Theme
### [app/globals.css](file:///c:/Users/willh/Desktop/games/app/globals.css) & [app/layout.tsx](file:///c:/Users/willh/Desktop/games/app/layout.tsx)
- **Purpose**: Defines the Tailwind layers, CSS variables for the color palette, and the root structure (including fonts and analytics).
- **When to use**: To change the primary color theme or font of the entire platform.
