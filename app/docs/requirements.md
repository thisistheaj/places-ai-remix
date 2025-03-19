# Places AI - Requirements Document

## 1. Project Setup and Configuration

### 1.1 Remix and Phaser Integration
- [x] Set up Remix project with Phaser integration
- [x] Configure Vite for bundling
- [x] Set up TypeScript for type safety
- [x] Configure ESLint and Prettier for code quality

#### Acceptance Criteria:
- [x] Phaser game loads within Remix application
- [x] Game state can be accessed from React components via EventBus
- [x] TypeScript types are properly defined for game objects
- [x] Code linting passes without errors

### 1.2 Firebase Integration
- [x] Set up Firebase project
- [x] Configure Firebase Realtime Database
- [x] Set up Firebase Authentication with Google provider
- [x] Create environment variables for Firebase configuration

#### Acceptance Criteria:
- [x] Firebase configuration is stored in environment variables
- [x] Firebase SDK is properly initialized in a single shared module
- [x] Authentication with Google works correctly
- [x] Realtime Database can be read from and written to

### 1.3 Shared Library Creation
- [x] Create a consolidated Firebase module for authentication and database operations
- [x] Define TypeScript interfaces for all data structures

#### Acceptance Criteria:
- [x] Firebase module can be imported and used throughout the application
- [x] Data structures are consistently typed across the application
- [x] No redundant code between game and chat components

## 2. Application Structure and Routing

### 2.1 User Authentication
- [x] Implement Google authentication flow
- [x] Create user profile on first login
- [x] Store user data in Firebase
- [x] Handle authentication state changes

#### Acceptance Criteria:
- [x] Users can sign in with Google
- [x] New users have profiles created automatically
- [x] Returning users have their data loaded correctly
- [x] Authentication state persists across page refreshes
- [x] Users can sign out

### 2.2 Application Routes
- [x] Create a landing page at root route
- [x] Implement login page with authentication UI
- [x] Create protected game route for authenticated users
- [x] Add route guards for authentication

#### Acceptance Criteria:
- [x] Landing page provides information about the application
- [x] Login page handles authentication flow
- [x] Game route is only accessible to authenticated users
- [x] Unauthenticated users are redirected to login
- [x] Navigation between routes works correctly

## 3. Game World Implementation

### 3.1 Tilemap Creation
- [x] Design tilemap for game world
- [x] Implement room areas within the map
- [x] Create tile layers for different elements
- [x] Add visual elements for different areas

#### Acceptance Criteria:
- [x] Game world is rendered with proper tiles
- [x] Different rooms are visually distinct
- [x] Map has designated walkable and non-walkable areas
- [x] Map is properly sized for the application

### 3.2 Player Movement and Animation
- [x] Implement grid-based movement system
- [x] Create player sprites with directional animations
- [x] Add movement controls (WASD)
- [x] Implement collision detection with map boundaries and obstacles
- [x] Synchronize movement with Firebase

#### Acceptance Criteria:
- [x] Players move one tile at a time
- [x] Movement is smooth with proper animation
- [x] Player faces the direction of movement
- [x] Players cannot move through walls or obstacles
- [x] Player position is synchronized with Firebase
- [x] Other players' movements are visible in real-time

### 3.3 Room Detection
- [ ] Implement room entry/exit detection
- [ ] Create visual indicators for room boundaries
- [ ] Update player's current room in Firebase
- [ ] Trigger events on room change via EventBus

#### Acceptance Criteria:
- [ ] System detects when player enters or exits a room
- [ ] Room boundaries are visually clear to users
- [ ] Player's current room is updated in Firebase
- [ ] Room change events trigger appropriate UI updates

### 3.4 Player Data Management
- [ ] Extend Firebase module with player data functions
- [ ] Implement player creation and update functions
- [ ] Create functions for updating player position and room
- [ ] Set up real-time player data synchronization

#### Acceptance Criteria:
- [ ] Player data is stored in Firebase with proper structure
- [ ] Player position and direction are updated in real-time
- [ ] Player room changes are reflected in the database
- [ ] Other players' movements are visible to all users
- [ ] Player data is properly typed with TypeScript interfaces

## 4. Chat System Implementation

### 4.1 Chat UI
- [ ] Create collapsible chat interface
- [ ] Implement chat tabs for different contexts
- [ ] Style chat messages based on type
- [ ] Add user name display in chat

#### Acceptance Criteria:
- [ ] Chat UI is positioned in the bottom right corner
- [ ] Chat can be collapsed/expanded
- [ ] Different message types have distinct styling
- [ ] User names are displayed with messages
- [ ] Chat UI is responsive

### 4.2 Chat Context Switching
- [ ] Implement global chat
- [ ] Create room-specific chat channels
- [ ] Implement direct messaging between nearby players
- [ ] Handle context switching based on player location

#### Acceptance Criteria:
- [ ] Chat context automatically changes when entering/exiting rooms
- [ ] Direct messaging is available when players are adjacent
- [ ] Global chat is always accessible
- [ ] Chat history loads correctly when switching contexts
- [ ] Messages are sent to the correct context

### 4.3 Message Handling
- [ ] Extend Firebase module with message functions
- [ ] Implement message sending for different contexts
- [ ] Create listeners for different message types
- [ ] Handle message formatting and display

#### Acceptance Criteria:
- [ ] Messages are stored in the correct Firebase paths
- [ ] New messages appear in real-time
- [ ] Messages include sender information and timestamps
- [ ] Message history is loaded when opening chat
- [ ] System messages are displayed for events
- [ ] Message functions are properly typed with TypeScript interfaces

### 4.4 Chat Module Creation
- [ ] Implement a shared chat module for functionality used across components and API
- [ ] Create helper functions for chat context management
- [ ] Implement message formatting and display utilities
- [ ] Create context switching logic

#### Acceptance Criteria:
- [ ] Chat module provides functionality for both components and API endpoints
- [ ] Chat context changes automatically based on player location
- [ ] Message display is consistent across the application
- [ ] System messages are generated for important events

## 5. Presence System

### 5.1 Player Presence Implementation
- [ ] Extend Firebase module with presence functions
- [ ] Implement lastSeenAt timestamp updates
- [ ] Create presence indicators (green/yellow) above players in game
- [ ] Add presence indicators next to user names in chat
- [ ] Set up disconnect handlers for Firebase
- [ ] Implement presence polling

#### Acceptance Criteria:
- [ ] Player's lastSeenAt is updated at regular intervals
- [ ] Presence indicator shows green when user is active (seen in last 5 minutes)
- [ ] Presence indicator shows yellow when user is inactive
- [ ] Presence indicators are consistent between game and chat
- [ ] Player data is removed when disconnected
- [ ] Other players can see presence status in real-time
- [ ] Presence functions are properly typed with TypeScript interfaces

## 6. Bot Integration

### 6.1 API for LLM Bots
- [ ] Create API endpoints for bot interactions (auth, move, message, presence)
- [ ] Implement bot authentication
- [ ] Ensure API endpoints use the same shared Firebase module
- [ ] Document API for bot developers

#### Acceptance Criteria:
- [ ] Bots can authenticate with the system
- [ ] Bots can move around the game world via API
- [ ] Bots can send messages to chat via API
- [ ] Bots have presence indicators
- [ ] API endpoints use the same shared modules as the main application

### 6.2 Bot Behavior
- [ ] Implement basic bot movement patterns
- [ ] Create conversation capabilities
- [ ] Add room awareness for bots
- [ ] Implement bot-to-user interactions

#### Acceptance Criteria:
- [ ] Bots can navigate the game world
- [ ] Bots can respond to user messages
- [ ] Bots are aware of their current room
- [ ] Bots can initiate conversations with nearby users
- [ ] Bot behavior is configurable

## 7. Performance and Optimization

### 7.1 State Management Optimization
- [ ] Implement efficient state updates
- [ ] Optimize Firebase listeners
- [ ] Add pagination for chat history
- [ ] Implement data caching

#### Acceptance Criteria:
- [ ] Application maintains responsive performance
- [ ] Firebase listeners are detached when not needed
- [ ] Chat history loads in batches
- [ ] Frequently accessed data is cached

### 7.2 Asset Optimization
- [ ] Optimize tilemap assets
- [ ] Implement sprite sheet compression
- [ ] Add asset preloading
- [ ] Implement lazy loading where appropriate

#### Acceptance Criteria:
- [ ] Game assets load quickly
- [ ] Sprite animations run smoothly
- [ ] Initial load time is minimized
- [ ] Assets are properly cached

## 8. Testing and Deployment

### 8.1 Testing
- [ ] Implement unit tests for shared modules
- [ ] Create integration tests for game-chat interaction
- [ ] Test authentication flows
- [ ] Perform cross-browser testing

#### Acceptance Criteria:
- [ ] All core functions have unit tests
- [ ] Integration tests verify system behavior
- [ ] Authentication flows work in all supported browsers
- [ ] Application functions correctly across devices

### 8.2 Deployment
- [ ] Set up CI/CD pipeline
- [ ] Configure production Firebase instance
- [ ] Implement environment-specific configurations
- [ ] Create deployment documentation

#### Acceptance Criteria:
- [ ] Application can be deployed automatically
- [ ] Production environment is properly secured
- [ ] Environment variables are managed securely
- [ ] Deployment process is documented 