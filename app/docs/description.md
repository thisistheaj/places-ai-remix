# HackerHouse AI - Project Description

HackerHouse AI is an AI-enabled virtual workspace platform inspired by Gather Town, designed to facilitate remote collaboration through an interactive, spatial experience. The application allows users and AI bots to navigate a virtual environment, join different meeting rooms, and communicate through contextual chat. The platform automatically switches chat contexts based on user location and proximity, creating a natural flow of conversation similar to physical office spaces.

The application is built on a modern web stack that combines real-time game mechanics with robust web application architecture. At its core, Remix handles routing, server-side rendering, and state management, while Phaser provides the game engine capabilities for the interactive virtual world. Firebase Realtime Database powers the backend, managing authentication, user presence, and real-time communication between users and bots.

Key technical components include:
- **Remix**: Handles routing, server-side rendering, and shared state between game and chat
- **React**: Powers the UI components, particularly the chat interface
- **Phaser 3**: Renders the game world, handles player movement and animations
- **Firebase**: Provides authentication, real-time database, and presence system
- **TypeScript**: Ensures type safety across the codebase
- **Vite**: Bundles and optimizes the application for production

The application features grid-based movement with animated sprites, contextual chat that changes based on location, presence indicators for online status, and an API for AI bot integration. This combination creates an immersive virtual workspace where human users and AI assistants can collaborate seamlessly. 