# Firebase Cloud Messaging (FCM) Implementation Plan

This document outlines the approach for adding push notifications to the Places AI messaging system using Firebase Cloud Functions and Firebase Cloud Messaging (FCM).

## High-Level Approach

1. **User Subscription Management**: Store user notification preferences and FCM tokens
2. **Firebase Cloud Functions**: Watch for new messages in the database
3. **Notification Delivery**: Send FCM messages based on user preferences
4. **Client-Side Integration**: Handle FCM setup and notifications in the Remix app

## Detailed Implementation Plan

### 1. User Subscription Management

We need to store:
- FCM tokens for each device/browser
- User notification preferences

```typescript
interface NotificationPreferences {
  global: boolean;
  dm: boolean;
  room: boolean;
  mentions: boolean;
}

interface UserDevice {
  token: string;
  lastSeen: number;
}
```

These would be stored at:
- `notifications/tokens/{userId}/{tokenId}`: FCM tokens for each user's devices
- `notifications/preferences/{userId}`: User notification preferences

### 2. Firebase Cloud Functions Implementation

We'll need cloud functions that watch the message paths:

```typescript
// Listen for new global messages
exports.onGlobalMessage = functions.database
  .ref('messages/global/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    return notifyUsersForGlobalMessage(message);
  });

// Listen for new DM messages
exports.onDirectMessage = functions.database
  .ref('messages/dm/{conversationId}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    const [sender, receiver] = context.params.conversationId.split('_');
    return notifyUserForDirectMessage(message, receiver);
  });

// Listen for new room messages
exports.onRoomMessage = functions.database
  .ref('messages/rooms/{roomName}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    const roomName = context.params.roomName;
    return notifyUsersForRoomMessage(message, roomName);
  });
```

### 3. Notification Delivery Logic

For each notification type, we need to:
1. Check which users to notify based on preferences
2. Get their FCM tokens
3. Send personalized notifications

```typescript
async function notifyUserForDirectMessage(message, receiverId) {
  // Don't notify sender of their own messages
  if (message.senderId === receiverId) return null;
  
  // Check if user wants DM notifications
  const prefsSnapshot = await admin.database()
    .ref(`notifications/preferences/${receiverId}`).get();
  const prefs = prefsSnapshot.val() || { dm: true };
  
  if (!prefs.dm) return null;
  
  // Get user's FCM tokens
  const tokensSnapshot = await admin.database()
    .ref(`notifications/tokens/${receiverId}`).get();
  const tokens = tokensSnapshot.val() || {};
  
  // Send notification to all user devices
  const tokenValues = Object.values(tokens).map(t => t.token);
  if (tokenValues.length === 0) return null;
  
  return admin.messaging().sendMulticast({
    tokens: tokenValues,
    notification: {
      title: `Message from ${message.sender}`,
      body: message.text,
      clickAction: `https://your-app.com/app?dm=${message.senderId}`
    }
  });
}
```

Similar functions would be created for global and room messages, with appropriate targeting logic.

### 4. Client-Side Integration

In our Remix app, we need to:
1. Request notification permission
2. Get and store FCM token
3. Handle incoming notifications

```typescript
// In a new file: app/lib/notifications.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { database, ref, set, serverTimestamp } from './firebase';

let messaging;

export const initializeMessaging = async (userId) => {
  if (typeof window === 'undefined') return;
  
  try {
    const { getMessaging } = await import('firebase/messaging');
    messaging = getMessaging();
    
    // Request permission 
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    
    // Get token
    const token = await getToken(messaging, {
      vapidKey: window.ENV.FIREBASE_VAPID_KEY
    });
    
    // Store token in Firebase
    if (token) {
      const tokenRef = ref(database, `notifications/tokens/${userId}/${token}`);
      await set(tokenRef, {
        token,
        lastSeen: serverTimestamp()
      });
    }
    
    // Set up foreground notification handler
    onMessage(messaging, (payload) => {
      // Handle foreground notifications
      console.log('Message received in foreground:', payload);
      // Show custom notification UI
    });
    
    return token;
  } catch (error) {
    console.error('Error initializing messaging:', error);
  }
};

export const updateNotificationPreferences = (userId, preferences) => {
  const prefsRef = ref(database, `notifications/preferences/${userId}`);
  return set(prefsRef, preferences);
};
```

## Implementation Steps

1. **Set up Firebase project for FCM**:
   - Generate VAPID key in Firebase console
   - Update security rules for notification preferences
   - Add environment variable for VAPID key

2. **Create cloud functions**:
   - Set up Firebase Cloud Functions project
   - Implement message listeners for all chat contexts
   - Deploy functions to Firebase

3. **Client integration**:
   - Add notification permission request to app initialization
   - Create notification preferences UI in settings
   - Implement token management
   - Add Firebase messaging service worker

4. **Testing and refinement**:
   - Test notifications across devices/browsers
   - Verify token refresh handling
   - Test with app in foreground and background

## Considerations

1. **Security Rules**: Update Firebase security rules to protect notification preferences and tokens
2. **Token Cleanup**: Periodically clean up invalid/unused tokens (create a cleanup function)
3. **Browser Support**: FCM works differently across browsers; may need fallbacks
4. **Service Worker**: Need a Firebase Messaging Service Worker for background notifications
5. **Badge and notification grouping**: Consider grouping multiple notifications from same sender
6. **Battery & Performance**: Optimize token refresh and background operation for mobile devices
7. **Offline handling**: Queue notifications for offline users to show when they reconnect 

## Implementation Checklist

- [ ] **Firebase Console Setup**
  - [ ] Enable Firebase Cloud Messaging in Firebase Console
  - [ ] Generate VAPID key
  - [ ] Set up basic security rules

- [ ] **User Notification Preferences (UI to Database)**
  - [ ] Create database schema for notification preferences
  - [ ] Create notifications.ts client library with preference functions
  - [ ] Build notification preferences UI component
  - [ ] Integrate preference UI into user settings
  - [ ] Test: Verify user can save preferences and see them in Firebase

- [ ] **Device Registration (Browser to Database)**
  - [ ] Add FCM JavaScript SDK
  - [ ] Create service worker file for Firebase messaging
  - [ ] Implement permission request and token storage
  - [ ] Test: Verify user devices appear in Firebase after granting permission

- [ ] **Simple FCM Test Function**
  - [ ] Set up Cloud Functions skeleton project
  - [ ] Create a test function that sends notifications on demand
  - [ ] Test: Manually trigger notifications to registered devices

- [ ] **Global Chat Notifications**
  - [ ] Implement global message listener function
  - [ ] Create notification delivery logic for global messages
  - [ ] Test: Send global message and verify notifications appear

- [ ] **Direct Message Notifications**
  - [ ] Implement DM message listener function
  - [ ] Create notification delivery logic for DMs
  - [ ] Test: Send DM and verify notification appears

- [ ] **Room Message Notifications**
  - [ ] Implement room message listener function
  - [ ] Create notification delivery logic for room messages
  - [ ] Test: Send room message and verify notification appears

- [ ] **Notification Click Handling**
  - [ ] Implement notification click handlers in service worker
  - [ ] Configure deep linking to the appropriate chat context
  - [ ] Test: Click notification and verify app opens to correct chat

- [ ] **Refinement and Optimization**
  - [ ] Add token cleanup function
  - [ ] Implement notification grouping for multiple messages
  - [ ] Test cross-browser and mobile compatibility 