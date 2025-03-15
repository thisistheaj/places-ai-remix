# Project Structure

```
places-ai-remix/
├── app/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatMessages.tsx
│   │   │   └── ChatTabs.tsx
│   │   ├── auth/
│   │   │   ├── AuthContainer.tsx
│   │   │   ├── LoginButton.tsx
│   │   │   └── UserProfile.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── PresenceIndicator.tsx
│   │       └── Modal.tsx
│   ├── game/
│   │   ├── scenes/
│   │   │   ├── Boot.ts
│   │   │   ├── Preloader.ts
│   │   │   ├── MainMenu.ts
│   │   │   ├── Game.ts
│   │   │   └── GameOver.ts
│   │   ├── objects/
│   │   │   ├── Player.ts
│   │   │   └── Room.ts
│   │   ├── main.ts
│   │   ├── PhaserGame.tsx
│   │   ├── EventBus.ts
│   │   └── types.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── chat.ts
│   ├── models/
│   │   ├── player.ts
│   │   ├── message.ts
│   │   └── room.ts
│   ├── routes/
│   │   ├── _index.tsx
│   │   ├── login.tsx
│   │   ├── game.tsx
│   │   └── api/
│   │       ├── auth.ts
│   │       ├── move.ts
│   │       ├── message.ts
│   │       └── presence.ts
│   ├── styles/
│   │   ├── global.css
│   │   ├── chat.css
│   │   └── game.css
│   ├── assets/
│   │   ├── tilemaps/
│   │   │   └── world.json
│   │   ├── tilesets/
│   │   │   └── tileset.png
│   │   └── sprites/
│   │       ├── player.png
│   │       └── bot.png
│   ├── docs/
│   │   ├── requirements.md
│   │   ├── description.md
│   │   ├── datatypes.mmd
│   │   ├── journey.mmd
│   │   └── structure.md
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   ├── app.client.tsx
│   └── root.tsx
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── vite/
│   ├── config.dev.mjs
│   └── config.prod.mjs
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── README.md
```

## Key Directory Explanations

### `/app/components`
Contains all React components organized by functionality (chat, auth, ui).

### `/app/game`
Houses all Phaser game-related code, following the template structure:
- `main.ts`: Configures and initializes the Phaser game
- `PhaserGame.tsx`: React component that renders the game and handles communication with React
- `EventBus.ts`: Facilitates event communication between Phaser and React
- `scenes/`: Contains all game scenes (Boot, Preloader, Game, etc.)
- `objects/`: Contains game object classes like Player and Room

### `/app/lib`
Contains shared utilities that need to be accessed by multiple parts of the application:
- `firebase.ts`: Handles all Firebase configuration, authentication, and database operations
- `chat.ts`: Manages chat functionality that needs to be shared between components and API

### `/app/models`
Defines TypeScript interfaces and types for the application's data structures.

### `/app/routes`
Contains all Remix routes:
- Main application routes (`_index.tsx`, `login.tsx`, `game.tsx`)
- API routes (`/api/*`) - exclusively for bot interactions, not used by the game or chat components
  - `auth.ts`: Bot authentication
  - `move.ts`: Bot movement
  - `message.ts`: Bot messaging
  - `presence.ts`: Bot presence updates

### `/app/assets`
Stores game assets like tilemaps, tilesets, and sprite sheets.

### `/app/styles`
Contains CSS files for styling the application.

### `/app/docs`
Houses project documentation files.

### `/vite`
Contains Vite configuration files for development and production. 