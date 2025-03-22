import { onValueCreated } from 'firebase-functions/v2/database';
import { getMessaging } from 'firebase-admin/messaging';
import { getDatabase } from 'firebase-admin/database';
import { initializeApp } from 'firebase-admin/app';
import type { MulticastMessage } from 'firebase-admin/messaging';
import fetch from 'node-fetch';

initializeApp();

interface NotificationPreferences {
  global: boolean;
  dm: boolean;
  room: boolean;
  mentions: boolean;
}

interface MessageData {
  type: string;
  uid: string;
  sender: string;
  text: string;
}

// Helper to get user's notification preferences
async function getUserPreferences(userId: string): Promise<NotificationPreferences> {
  const prefsSnapshot = await getDatabase()
    .ref(`notifications/preferences/${userId}`)
    .once('value');
  
  return prefsSnapshot.val() || {
    global: true,
    dm: true,
    room: true,
    mentions: true
  };
}

// Helper to get user's FCM tokens
async function getUserTokens(userId: string): Promise<string[]> {
  const tokensSnapshot = await getDatabase()
    .ref(`notifications/tokens/${userId}`)
    .once('value');
  
  if (!tokensSnapshot.exists()) return [];
  
  return Object.values(tokensSnapshot.val())
    .map((t: any) => t.token)
    .filter(Boolean);
}

// Function to handle global messages
export const onGlobalMessageCreated = onValueCreated('/messages/global/{messageId}', async (event) => {
  const message = event.data.val() as MessageData;
  
  // Don't send notifications for system messages
  if (message.type === 'system') return null;
  
  // Don't send notifications to self
  const senderId = message.uid;
  if (!senderId) return null;

  console.log('Global message function triggered:', {
    messageId: event.params.messageId,
    message,
    path: event.data.ref.toString()
  });
  
  try {
    // For global messages, get all users with global notifications enabled AND who have tokens
    const [prefsSnapshot, tokensSnapshot] = await Promise.all([
      getDatabase().ref('notifications/preferences').once('value'),
      getDatabase().ref('notifications/tokens').once('value')
    ]);
    
    const prefs = prefsSnapshot.val() || {};
    const tokens = tokensSnapshot.val() || {};
    
    console.log('Found preferences:', Object.keys(prefs).length);
    console.log('Found tokens:', Object.keys(tokens).length);
    
    // Only include users who have both preferences and tokens
    const targetUserIds = Object.keys(prefs).filter(userId => {
      const userPrefs = prefs[userId];
      const hasToken = !!tokens[userId];
      const isNotSender = userId !== senderId;
      const hasGlobalEnabled = userPrefs?.global;

      console.log(`Evaluating user ${userId}:`, {
        hasToken,
        isNotSender,
        hasGlobalEnabled,
        userPrefs
      });

      return isNotSender && hasGlobalEnabled && hasToken;
    });
    
    console.log('Selected target users for global message:', targetUserIds);
    
    // Get tokens for all target users
    const tokenPromises = targetUserIds.map(userId => getUserTokens(userId));
    const tokenResults = await Promise.all(tokenPromises);
    const allTokens = tokenResults.flat();
    
    console.log('All tokens:', allTokens);
    
    if (allTokens.length === 0) {
      console.log('No tokens found for any target users, skipping notification');
      return null;
    }
    
    // Create notification message
    const notificationMessage: MulticastMessage = {
      notification: {
        title: 'New Message in Global Chat',
        body: message.text
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title: 'New Message in Global Chat',
          body: message.text,
          requireInteraction: true,
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        },
        fcmOptions: {
          link: '/'
        }
      },
      data: {
        messageContext: 'global',
        messageId: event.params.messageId,
        senderId,
        senderName: message.sender,
        url: '/'
      },
      tokens: allTokens
    };

    console.log('Attempting to send notification with payload:', JSON.stringify(notificationMessage, null, 2));
    
    // Send the notification
    const response = await getMessaging().sendEachForMulticast(notificationMessage);
    console.log('Full FCM response:', JSON.stringify(response, null, 2));

    // Clean up invalid tokens if any
    const failedTokens = response.responses
      .map((resp, idx) => resp.success ? null : allTokens[idx])
      .filter(Boolean);

    if (failedTokens.length > 0) {
      console.log('Found invalid tokens:', failedTokens);
      // Remove invalid tokens from the database
      await Promise.all(targetUserIds.map(async (userId) => {
        const userTokens = await getUserTokens(userId);
        const validTokens = userTokens.filter(token => !failedTokens.includes(token));
        if (validTokens.length !== userTokens.length) {
          await getDatabase()
            .ref(`notifications/tokens/${userId}`)
            .set(validTokens.map(token => ({ token })));
        }
      }));
    }

    return {
      success: true,
      recipients: targetUserIds.length,
      successCount: response.successCount
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return null;
  }
});

// Function to handle DM and room messages
export const onChatMessageCreated = onValueCreated('/messages/{context}/{chatId}/{messageId}', async (event) => {
  const message = event.data.val() as MessageData;
  const { context: messageContext, chatId, messageId } = event.params;
  
  // Skip if not a DM or room message
  if (messageContext !== 'dm' && messageContext !== 'rooms') return null;
  
  // Don't send notifications for system messages
  if (message.type === 'system') return null;
  
  // Don't send notifications to self
  const senderId = message.uid;
  if (!senderId) return null;

  console.log('Chat message function triggered:', {
    messageContext,
    chatId,
    messageId,
    message,
    path: event.data.ref.toString()
  });
  
  try {
    let targetUserIds: string[] = [];
    
    if (messageContext === 'dm') {
      // For DMs, get the other user from the chatId
      const [user1, user2] = chatId.split('_');
      const targetId = user1 === senderId ? user2 : user1;
      const prefs = await getUserPreferences(targetId);
      
      if (prefs.dm) {
        targetUserIds = [targetId];
      }
    }
    else if (messageContext === 'rooms') {
      // For room messages, get all users in the room with room notifications enabled
      const roomUsersSnapshot = await getDatabase()
        .ref(`rooms/${chatId}/users`)
        .once('value');
      
      console.log('Room message - Room users:', JSON.stringify(roomUsersSnapshot.val()));
      
      const roomUsers = roomUsersSnapshot.val() || {};
      targetUserIds = Object.keys(roomUsers)
        .filter(userId => userId !== senderId);
      
      console.log('Room message - Potential target users:', targetUserIds);
        
      // Filter to only users with room notifications enabled AND who have tokens
      const [prefsResults, tokenResults] = await Promise.all([
        Promise.all(targetUserIds.map(userId => getUserPreferences(userId))),
        Promise.all(targetUserIds.map(userId => getUserTokens(userId)))
      ]);
      
      targetUserIds = targetUserIds.filter((userId, index) => {
        const hasRoomEnabled = prefsResults[index].room;
        const hasTokens = tokenResults[index].length > 0;
        console.log(`Checking room user ${userId}:`, {
          hasRoomEnabled,
          hasTokens,
          included: hasRoomEnabled && hasTokens
        });
        return hasRoomEnabled && hasTokens;
      });
      
      console.log('Room message - Final target users:', targetUserIds);
    }
    
    // Get tokens for all target users
    const tokenPromises = targetUserIds.map(userId => getUserTokens(userId));
    const tokenResults = await Promise.all(tokenPromises);
    const allTokens = tokenResults.flat();
    
    console.log('All target users:', targetUserIds);
    console.log('All tokens:', allTokens);
    
    if (allTokens.length === 0) {
      console.log('No tokens found for any target users, skipping notification');
      return null;
    }
    
    // Create notification message
    const notificationMessage: MulticastMessage = {
      notification: {
        title: messageContext === 'dm' ? `New Message from ${message.sender}` : `New Message in ${chatId}`,
        body: message.text
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title: messageContext === 'dm' ? `New Message from ${message.sender}` : `New Message in ${chatId}`,
          body: message.text,
          requireInteraction: true,
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        },
        fcmOptions: {
          link: '/'
        }
      },
      data: {
        messageContext,
        chatId,
        messageId,
        senderId,
        senderName: message.sender,
        url: '/'
      },
      tokens: allTokens
    };

    console.log('Attempting to send notification with payload:', JSON.stringify(notificationMessage, null, 2));
    
    // Send the notification
    const response = await getMessaging().sendEachForMulticast(notificationMessage);
    console.log('Full FCM response:', JSON.stringify(response, null, 2));

    // Clean up invalid tokens if any
    const failedTokens = response.responses
      .map((resp, idx) => resp.success ? null : allTokens[idx])
      .filter(Boolean);

    if (failedTokens.length > 0) {
      console.log('Found invalid tokens:', failedTokens);
      // Remove invalid tokens from the database
      await Promise.all(targetUserIds.map(async (userId) => {
        const userTokens = await getUserTokens(userId);
        const validTokens = userTokens.filter(token => !failedTokens.includes(token));
        if (validTokens.length !== userTokens.length) {
          await getDatabase()
            .ref(`notifications/tokens/${userId}`)
            .set(validTokens.map(token => ({ token })));
        }
      }));
    }

    return {
      success: true,
      recipients: targetUserIds.length,
      successCount: response.successCount
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return null;
  }
});

// Function to handle messages sent to bots
export const onMessageToBot = onValueCreated('/messages/dm/{chatId}/{messageId}', async (event) => {
  const message = event.data.val() as MessageData & { targetId?: string };
  const { chatId, messageId } = event.params;
  
  // Don't process system messages
  if (message.type === 'system') return null;
  
  // We need targetId to determine the recipient
  if (!message.targetId) {
    console.log('Message has no targetId, skipping bot check');
    return null;
  }

  console.log('Checking if message is to a bot:', {
    chatId,
    messageId,
    senderId: message.uid,
    targetId: message.targetId,
    text: message.text
  });
  
  try {
    // Check if the target is a bot
    const targetUserSnapshot = await getDatabase()
      .ref(`players/${message.targetId}`)
      .once('value');
    
    const targetUser = targetUserSnapshot.val();
    
    if (!targetUser) {
      console.log(`Target user ${message.targetId} not found`);
      return null;
    }
    
    // If not a bot, exit
    if (!targetUser.isBot) {
      console.log(`Target user ${message.targetId} is not a bot`);
      return null;
    }
    
    console.log(`Target user ${message.targetId} is a bot, forwarding message to /receive endpoint`);
    
    // Forward the message to the bot's receive endpoint
    const apiUrl = process.env.API_URL || 'https://aihacker.house';
    const receiveUrl = `${apiUrl}/api/receive/${message.targetId}`;
    
    const response = await fetch(receiveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.ADMIN_TOKEN || 'master-of-bots'
      },
      body: JSON.stringify({
        message: message.text,
        sourceUserId: message.uid
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error from receive endpoint: ${response.status} - ${errorData}`);
      return {
        success: false,
        error: `Failed to process message: ${response.status}`
      };
    }
    
    const result = await response.json();
    console.log('Bot response processed successfully:', result);
    
    return {
      success: true,
      botResponse: result
    };
  } catch (error) {
    console.error('Error processing message to bot:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}); 