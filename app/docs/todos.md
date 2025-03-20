# Chat System Implementation

## 1. Global Chat
- [x] As a user, I want to see a chat window when I join the game
  - [x] Chat window appears in bottom right corner
  - [x] Default state is collapsed, showing just header
  - [x] Header shows "Public Chat" when in global mode
  - [x] Clicking header expands/collapses chat
  - [x] Messages show sender name and timestamp

- [x] As a user, I want to send and receive global messages
  - [x] Input field at bottom of expanded chat
  - [x] Enter key sends message
  - [x] Messages appear in chronological order
  - [x] New messages auto-scroll to bottom
  - [x] Messages persist in Firebase at 'messages/global'

## 2. Direct Messages
- [x] As a user, I want to automatically DM nearby players
  - [x] System detects when another player is within 1 tile
  - [x] Chat context automatically switches to DM
  - [x] Header changes to show "Chat with {player_name}"
  - [x] Returns to global chat when player moves away
  - [x] Shows clear visual feedback when context switches

- [x] As a user, I want my DMs to be private
  - [x] Messages stored at 'messages/dm/{sorted_user_ids}'
  - [x] Only participants can see the messages
  - [x] Messages persist between encounters
  - [x] Clear indication that chat is private

## 3. Message Management
- [x] As a user, I want reliable message delivery
  - [x] Messages have unique IDs
  - [x] Messages include sender ID, name, timestamp
  - [x] Failed messages show error state
  - [x] Network disconnects handled gracefully

- [x] As a user, I want a clean message history
  - [x] System messages for context switches
  - [x] Empty states handled gracefully

## 4. UI/UX Requirements
- [x] As a user, I want a polished chat experience
  - [x] Smooth expand/collapse animation
  - [x] Visual feedback when sending
  - [x] Unread message indicator when collapsed
  - [x] Keyboard shortcuts (Enter to send, Esc to collapse)
  - [x] Mobile-friendly touch targets

## Implementation Steps
1. [x] Set up Firebase paths and security rules
2. [x] Create basic chat UI with global messages
3. [x] Add player proximity detection
4. [x] Implement DM switching
5. [x] Add animations and polish

## Technical Notes

### State Synchronization Patterns
- Chat state lives in Firebase as source of truth
- Proximity detection in Game scene updates Firebase
- React chat components subscribe to Firebase for updates
- Use EventBus ONLY for ephemeral UI events (e.g., "message sent" animation)
- Never sync message/presence state through EventBus

### Firebase Structure
```
messages/
  global/
    - messageId: {senderId, senderName, text, timestamp}
  dm/
    user1_user2/  # IDs are always sorted alphabetically
      - messageId: {senderId, senderName, text, timestamp, recipientId}
players/
  userId/
    lastSeenAt: timestamp  # Updated on message send & movement
```

### Component Responsibilities
- Game Scene:
  - Detects nearby players
  - Updates Firebase with proximity state
  - Subscribes to presence updates for sprites
- React Chat:
  - Subscribes to relevant message paths
  - Handles message sending/display
  - Updates presence on message send
  - Manages UI state (collapse, input focus)

### Important Implementation Details
- DM channel IDs must be consistently sorted: `[id1, id2].sort().join('_')`
- Use `serverTimestamp()` for consistent message ordering
- Store player colors in Firebase, not local state
- Handle chat input focus/blur to disable game controls
- Clear Firebase subscriptions when switching contexts

### Edge Cases to Handle
- Player disconnects during DM
- Multiple nearby players (prioritize closest)
- Race conditions when switching chat contexts
- Firebase security rules for DM privacy
- Message history cleanup/pagination
- Reconnection and message backfill

### Performance Considerations
- Limit message history queries (50 messages)
- Unsubscribe from Firebase listeners when switching contexts
- Clean up old messages after 24 hours
- Batch presence updates
- Debounce proximity detection updates to Firebase

### Local State Management
- Chat collapse state in localStorage
- Message input state in component
- Loading/error states in components
- Animations and UI feedback states
- No persistent state in React/Phaser outside Firebase
