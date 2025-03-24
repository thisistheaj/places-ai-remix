import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { getUserProfile, getBotView } from '~/lib/user';
import { database, ref, get } from '~/lib/firebase';
import { sendGlobalMessage, sendDirectMessage, sendRoomMessage, PATHS } from '~/lib/chat';
import type { Player } from '~/models/player';

const isPositionNearby = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): boolean => {
  const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  return distance <= 1.5; // Using 1.5 to account for diagonal tiles (same as in Game.ts)
};

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Check for admin token in Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split('Bearer ').pop();
  
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { 
      status: 401 
    }); 
  }

  const { id } = params;
  if (!id) {
    return json({ 
      success: false, 
      error: 'Bot ID is required' 
    }, { 
      status: 400 
    });
  }

  try {
    // Parse request body for message text and optional target user ID
    const body = await request.json();
    const { text, targetUserId } = body;
    
    if (!text || typeof text !== 'string') {
      return json({ 
        success: false, 
        error: 'Message text is required' 
      }, { 
        status: 400 
      });
    }

    // Get bot profile to check if it exists and get its properties
    const bot = await getUserProfile(id);
    if (!bot) {
      return json({ 
        success: false, 
        error: 'Bot not found' 
      }, { 
        status: 404 
      });
    }

    if (!bot.isBot) {
      return json({ 
        success: false, 
        error: 'The provided ID is not a bot' 
      }, { 
        status: 400 
      });
    }

    let messageResult;
    let messageType = 'global'; // Default type
    let targetUser = null;

    // Priority 1: Provided user ID for direct message
    if (targetUserId && typeof targetUserId === 'string') {
      // Check if target user exists
      const targetUserProfile = await getUserProfile(targetUserId);
      if (!targetUserProfile) {
        return json({ 
          success: false, 
          error: 'Target user not found' 
        }, { 
          status: 404 
        });
      }

      // Send DM to target user
      await sendDirectMessage(text, bot.uid, bot.name, targetUserId);
      messageType = 'dm';
      targetUser = targetUserProfile;
    } 
    // Priority 2: Room-based message if bot is in a room
    else if (bot.room) {
      // Send message to the room
      await sendRoomMessage(text, bot.uid, bot.name, bot.room);
      messageType = 'room';
    }
    // Priority 3: Proximity-based DM if any player is nearby
    else {
      // Get all players
      const playersRef = ref(database, 'players');
      const playersSnapshot = await get(playersRef);
      const players = playersSnapshot.val() || {};
      
      // Find the closest player within range
      let closestPlayer: { id: string; data: Player } | null = null;
      let minDistance = Infinity;
      
      Object.entries(players).forEach(([playerId, playerData]) => {
        const player = playerData as Player;
        // Skip self
        if (playerId === bot.uid) return;
        
        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(bot.x - player.x, 2) + 
          Math.pow(bot.y - player.y, 2)
        );
        
        if (distance <= 1.5 && distance < minDistance) {
          minDistance = distance;
          closestPlayer = { id: playerId, data: player };
        }
      });
      
      if (closestPlayer !== null) {
        // Send DM to closest player
        await sendDirectMessage(text, bot.uid, bot.name, closestPlayer.id);
        messageType = 'dm';
        targetUser = closestPlayer.data;
      } 
      // Priority 4: Global message if no other conditions apply
      else {
        // Send global message
        await sendGlobalMessage(text, bot.uid, bot.name);
        messageType = 'global';
      }
    }

    return json({ 
      success: true,
      message: {
        text,
        sender: bot.name,
        senderId: bot.uid,
        type: messageType,
        ...(messageType === 'dm' ? { targetId: targetUser?.uid } : {}),
        ...(messageType === 'room' ? { room: bot.room } : {})
      }
    });
  } catch (error: any) {
    console.error('Error sending message from bot:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to send message' 
    }, { 
      status: 500 
    });
  }
}; 