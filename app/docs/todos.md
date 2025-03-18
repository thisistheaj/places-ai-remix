# Places AI - Implementation Plan

## Overview

This document outlines our implementation plan for Places AI, a virtual workspace platform that combines Phaser, Remix, and Firebase to create an interactive spatial experience. Based on the requirements document, we'll focus on implementing the game world, chat system, presence tracking, and bot integration.

## 1. Asset Integration and Map Building

### 1.1 Asset Preparation

We have access to two high-quality asset packs:
- [Modern Interiors](https://limezu.itch.io/moderninteriors) - Indoor textures and pre-built characters
- [Modern Office](https://limezu.itch.io/modernoffice) - Office-specific expansion textures

**Approach:**
1. **Asset Organization:**
   - Create an `assets` directory structure in `public/assets`
   - Organize by type: `tilesets`, `characters`, `animations`, `ui`
   - Use the 48px versions for better detail and modern screen compatibility

2. **Asset Processing:**
   - Extract only the assets we need to keep the bundle size manageable
   - Focus on office-themed tiles, furniture, and characters
   - Create sprite sheets for characters with animations (idle, walking)

### 1.2 Map Building Strategy

**Recommendation: Pre-built Tilemap with Tiled**

Creating a pre-built tilemap using Tiled is the recommended approach for several reasons:
1. **Quality and Design:** A pre-designed map allows for thoughtful layout planning
2. **Performance:** Pre-built maps load faster than procedurally generated ones
3. **Consistency:** Ensures all users see the same environment
4. **Complexity Management:** Office layouts with meeting rooms, hallways, and common areas require careful design

**Implementation Steps:**
1. Use Tiled to create a JSON tilemap with the following layers:
   - `floor` - Base floor tiles
   - `walls` - Wall structures and boundaries
   - `furniture` - Office furniture and decorations
   - `collision` - Invisible layer for collision detection
   - `rooms` - Invisible layer for room detection

2. Define room areas with properties in Tiled:
   - Room name
   - Room type (meeting room, common area, etc.)
   - Room capacity

3. Export the map as JSON and load it in Phaser

4. Alternative approach if needed: Create a simple procedural map generator for testing purposes

## 2. Game World Implementation

### 2.1 Phaser Scene Setup

1. **Create core game scenes:**
   - `BootScene` - Load assets and initialize
   - `MainScene` - Primary gameplay scene
   - `UIScene` - Overlay for UI elements

2. **Implement tilemap loading:**
   - Load the JSON tilemap in the boot scene
   - Create layers and set collisions
   - Add visual elements for different areas

3. **Camera setup:**
   - Configure camera to follow player
   - Set boundaries based on map size
   - Implement smooth camera movement

### 2.2 Player Implementation

1. **Player sprite and animation:**
   - Create player class with sprite and animations
   - Implement directional animations (up, down, left, right)
   - Add idle animations for each direction

2. **Grid-based movement system:**
   - Implement tile-by-tile movement
   - Add smooth transitions between tiles
   - Handle collision detection
   - Implement WASD controls

3. **Player data synchronization:**
   - Sync player position with Firebase
   - Update direction and animation state
   - Handle player joining and leaving

### 2.3 Room Detection System

1. **Room entry/exit detection:**
   - Check player position against room layer
   - Trigger events when entering/exiting rooms
   - Update player's current room in Firebase

2. **Visual indicators:**
   - Add subtle visual cues for room boundaries
   - Implement room name display when entering

3. **Room-based interactions:**
   - Define interaction points within rooms
   - Create special behaviors for different room types

## 3. Chat System Implementation

### 3.1 Chat UI Development

1. **Create chat components:**
   - Collapsible chat container
   - Message display area
   - Input field
   - Context tabs (Global, Room, DM)

2. **Style and positioning:**
   - Position in bottom right corner
   - Implement collapse/expand functionality
   - Style messages based on type and sender

### 3.2 Chat Context System

1. **Context management:**
   - Implement context switching based on player location
   - Create listeners for different message types
   - Handle message history loading

2. **Message types:**
   - Global messages (visible to all)
   - Room messages (visible to users in the same room)
   - Direct messages (visible to adjacent users)
   - System messages (events, notifications)

3. **Firebase integration:**
   - Structure message data in Firebase
   - Implement real-time listeners
   - Handle message pagination

## 4. Presence System

### 4.1 Player Presence

1. **Presence tracking:**
   - Implement lastSeenAt timestamp updates
   - Create Firebase onDisconnect handlers
   - Set up periodic presence updates

2. **Visual indicators:**
   - Add presence indicators above players
   - Implement status changes (active, inactive)
   - Sync presence across game and chat

### 4.2 Nearby Player Detection

1. **Proximity detection:**
   - Implement grid-based proximity check
   - Detect adjacent players
   - Update nearby players list in real-time

2. **Interaction opportunities:**
   - Enable direct messaging for nearby players
   - Show visual indicators for nearby players
   - Implement interaction options

## 5. Bot Integration

### 5.1 Bot API Development

1. **API endpoints:**
   - Authentication endpoint for bots
   - Movement control endpoint
   - Message sending endpoint
   - Status update endpoint

2. **Bot representation:**
   - Create bot player class
   - Implement bot-specific visuals
   - Add bot status indicators

### 5.2 Bot Behavior

1. **Movement patterns:**
   - Implement pathfinding for bots
   - Create idle behaviors
   - Add room awareness

2. **Conversation capabilities:**
   - Implement message handling
   - Create context-aware responses
   - Add proactive conversation initiation

## 6. Implementation Timeline

### Phase 1: Foundation (Week 1)
- Asset integration and organization
- Tilemap creation with Tiled
- Basic Phaser scene setup
- Player movement implementation

### Phase 2: Core Features (Week 2)
- Room detection system
- Firebase synchronization for player data
- Basic chat UI implementation
- Presence system foundation

### Phase 3: Advanced Features (Week 3)
- Complete chat system with context switching
- Proximity-based interactions
- Bot API development
- Polish and optimization

### Phase 4: Testing and Refinement (Week 4)
- Integration testing
- Performance optimization
- Bug fixes
- Documentation

## 7. Technical Considerations

### 7.1 Performance Optimization

1. **Firebase optimization:**
   - Use efficient data structures
   - Implement pagination for chat history
   - Detach listeners when not needed

2. **Asset loading:**
   - Implement progressive loading
   - Use sprite atlases for animations
   - Optimize tilemap rendering

### 7.2 State Management

1. **Shared state between React and Phaser:**
   - Use EventBus for communication
   - Implement state synchronization
   - Handle state updates efficiently

2. **Firebase real-time updates:**
   - Structure data for efficient updates
   - Implement optimistic updates
   - Handle conflict resolution

## 8. Next Steps

1. **Immediate actions:**
   - Set up asset directory structure
   - Create initial tilemap in Tiled
   - Implement basic player movement
   - Set up Firebase data structure

2. **Decision points:**
   - Confirm tilemap approach (pre-built vs. procedural)
   - Decide on character customization options
   - Determine chat UI design
   - Finalize bot integration approach

By following this plan, we'll create a cohesive implementation of Places AI that meets the requirements outlined in the documentation while leveraging the high-quality assets available to us. 


# UI Fixes

* implement turnaround
* implement character hitbox 
* implement collision
* "over" layers
   * top of meeting tables
   * southern meeting table chairs

* collisions
   * outer walls
   * conference walls 
   * bottom, conference desks
   * desks
   * bottom game tables

* maybe 
   * thicken conference wall