# Chat System Implementation

## 1. Global Chat
- [ ] As a user, I want to see a chat window when I join the game
  - [ ] Chat window appears in bottom right corner
  - [ ] Default state is collapsed, showing just header
  - [ ] Header shows "Public Chat" when in global mode
  - [ ] Clicking header expands/collapses chat
  - [ ] Messages show sender name and timestamp

- [ ] As a user, I want to send and receive global messages
  - [ ] Input field at bottom of expanded chat
  - [ ] Enter key sends message
  - [ ] Messages appear in chronological order
  - [ ] New messages auto-scroll to bottom
  - [ ] Messages persist in Firebase at 'messages/global'

## 2. Direct Messages
- [ ] As a user, I want to automatically DM nearby players
  - [ ] System detects when another player is within 1 tile
  - [ ] Chat context automatically switches to DM
  - [ ] Header changes to show "Chat with {player_name}"
  - [ ] Returns to global chat when player moves away
  - [ ] Shows clear visual feedback when context switches

- [ ] As a user, I want my DMs to be private
  - [ ] Messages stored at 'messages/dm/{sorted_user_ids}'
  - [ ] Only participants can see the messages
  - [ ] Messages persist between encounters
  - [ ] Clear indication that chat is private

## 3. Message Management
- [ ] As a user, I want reliable message delivery
  - [ ] Messages have unique IDs
  - [ ] Messages include sender ID, name, timestamp
  - [ ] Failed messages show error state
  - [ ] Network disconnects handled gracefully

- [ ] As a user, I want a clean message history
  - [ ] System messages for context switches
  - [ ] Empty states handled gracefully

## 4. UI/UX Requirements
- [ ] As a user, I want a polished chat experience
  - [ ] Smooth expand/collapse animation
  - [ ] Visual feedback when sending
  - [ ] Unread message indicator when collapsed
  - [ ] Keyboard shortcuts (Enter to send, Esc to collapse)
  - [ ] Mobile-friendly touch targets

## Implementation Steps
1. [ ] Set up Firebase paths and security rules
2. [ ] Create basic chat UI with global messages
3. [ ] Add player proximity detection
4. [ ] Implement DM switching
5. [ ] Add animations and polish

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