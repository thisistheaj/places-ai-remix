import { json } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getUserProfile } from '~/lib/user';
import OpenAI from 'openai';
import fetch from 'node-fetch';

// Constants
const MAX_ACTIONS = 10; // Maximum number of actions before auto-terminating
const PROXIMITY_THRESHOLD = 3; // How close we need to be to consider "near" a target

// Types
interface Position {
  x: number;
  y: number;
  direction: string;
}

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: string;
}

interface SeeResponse {
  success: boolean;
  position: Position;
  players: Player[];
}

interface Task {
  type: 'move_to_player' | 'move_to_coords' | 'send_message' | 'end';
  targetId?: string;
  targetCoords?: { x: number; y: number };
  message?: string;
  originalMessage: string;
}

// Helper functions
async function seeEnvironment(botId: string, token: string): Promise<SeeResponse> {
  const response = await fetch(`https://aihacker.house/api/see/${botId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

async function moveBot(botId: string, token: string, moves: string[]): Promise<any> {
  const response = await fetch(`https://aihacker.house/api/move/${botId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ moves })
  });
  return await response.json();
}

async function sendMessage(botId: string, token: string, text: string, targetUserId?: string): Promise<any> {
  const response = await fetch(`https://aihacker.house/api/send/${botId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      ...(targetUserId ? { targetUserId } : {})
    })
  });
  return await response.json();
}

async function determineNextAction(
  message: string,
  currentState: SeeResponse,
  openai: OpenAI,
  lastActionResult?: any
): Promise<Task> {
  console.log('[determineNextAction] Starting with message:', message);
  console.log('[determineNextAction] Current state:', {
    position: currentState.position,
    playerCount: currentState.players.length,
    lastActionResult
  });

  // If last action was blocked, send message and end sequence
  if (lastActionResult?.error === 'Position is blocked') {
    return {
      type: 'end',
      originalMessage: message
    };
  }

  // If last action was sending the wall message, end sequence
  if (lastActionResult?.message?.text === "I can't move further in that direction - there's a wall in the way.") {
    return {
      type: 'end',
      originalMessage: message
    };
  }

  // Check for direct movement commands first
  const moveUpMatch = message.match(/move up (\d+)/i);
  if (moveUpMatch) {
    const squares = parseInt(moveUpMatch[1]);
    const targetY = currentState.position.y - squares;
    
    // If we've reached or passed the target Y position, send completion message and end
    if (currentState.position.y <= targetY) {
      return {
        type: 'send_message',
        message: 'I have completed the movement.',
        originalMessage: message
      };
    }

    // If we hit a wall in the previous attempt, send wall message
    if (lastActionResult?.error === 'Position is blocked') {
      return {
        type: 'send_message',
        message: "I can't move further in that direction - there's a wall in the way.",
        originalMessage: message
      };
    }
    
    return {
      type: 'move_to_coords',
      targetCoords: {
        x: currentState.position.x,
        y: targetY
      },
      originalMessage: message
    };
  }

  const moveDownMatch = message.match(/move down (\d+)/i);
  if (moveDownMatch) {
    const squares = parseInt(moveDownMatch[1]);
    const targetY = currentState.position.y + squares;
    
    // If we've reached or passed the target Y position, send completion message and end
    if (currentState.position.y >= targetY) {
      return {
        type: 'send_message',
        message: 'I have completed the movement.',
        originalMessage: message
      };
    }
    
    return {
      type: 'move_to_coords',
      targetCoords: {
        x: currentState.position.x,
        y: targetY
      },
      originalMessage: message
    };
  }

  const moveLeftMatch = message.match(/move left (\d+)/i);
  if (moveLeftMatch) {
    const squares = parseInt(moveLeftMatch[1]);
    const targetX = currentState.position.x - squares;
    
    // If we've reached or passed the target X position, send completion message and end
    if (currentState.position.x <= targetX) {
      return {
        type: 'send_message',
        message: 'I have completed the movement.',
        originalMessage: message
      };
    }
    
    return {
      type: 'move_to_coords',
      targetCoords: {
        x: targetX,
        y: currentState.position.y
      },
      originalMessage: message
    };
  }

  const moveRightMatch = message.match(/move right (\d+)/i);
  if (moveRightMatch) {
    const squares = parseInt(moveRightMatch[1]);
    const targetX = currentState.position.x + squares;
    
    // If we've reached or passed the target X position, send completion message and end
    if (currentState.position.x >= targetX) {
      return {
        type: 'send_message',
        message: 'I have completed the movement.',
        originalMessage: message
      };
    }
    
    return {
      type: 'move_to_coords',
      targetCoords: {
        x: targetX,
        y: currentState.position.y
      },
      originalMessage: message
    };
  }

  // If no direct movement command matched, use GPT-4 for more complex commands
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an AI that determines the next action for a bot in a virtual space.
Based on the message and current state, you must decide what to do next.
You can:
1. Move to a player (type: move_to_player, needs targetId)
2. Move to coordinates (type: move_to_coords, needs targetCoords)
3. Send a message (type: send_message, needs message and optionally targetId)
4. End the sequence (type: end)

For multi-step commands:
- First move to the target location or player
- Once near the target, send any messages
- Then end the sequence

You must respond with ONLY a JSON object containing the action details, nothing else.
Example responses:
{"type": "move_to_player", "targetId": "user123"}
{"type": "send_message", "message": "Hello!", "targetId": "user123"}
{"type": "end"}`
      },
      {
        role: "user",
        content: `Message: "${message}"
Current position: ${JSON.stringify(currentState.position)}
Nearby players: ${JSON.stringify(currentState.players)}
What should I do next?`
      }
    ],
    temperature: 0.7,
  });

  try {
    const content = response.choices[0]?.message?.content || '{"type": "end"}';
    console.log('[determineNextAction] OpenAI response:', content);
    
    const action = JSON.parse(content.trim());
    console.log('[determineNextAction] Parsed action:', action);
    
    // If we're near the target player and haven't sent a message yet, send greeting
    if (action.type === 'move_to_player' && lastActionResult?.message === 'Already near target player') {
      const targetPlayer = currentState.players.find(p => p.id === action.targetId);
      if (targetPlayer) {
        // Check if we've already sent a message to this player
        if (lastActionResult?.message?.text?.includes(`Hello ${targetPlayer.name}!`)) {
          return {
            type: 'end',
            originalMessage: message
          };
        }
        return {
          type: 'send_message',
          message: `Hello ${targetPlayer.name}!`,
          targetId: targetPlayer.id,
          originalMessage: message
        };
      }
    }
    
    // After sending a message, end the sequence
    if (action.type === 'send_message' || lastActionResult?.message?.text?.startsWith('Hello ')) {
      return {
        type: 'end',
        originalMessage: message
      };
    }
    
    return {
      ...action,
      originalMessage: message
    };
  } catch (error) {
    console.error('[determineNextAction] Failed to parse action response:', error);
    return {
      type: 'end',
      originalMessage: message
    };
  }
}

function calculateMoves(current: Position, target: { x: number; y: number }): string[] {
  const moves: string[] = [];
  const dx = target.x - current.x;
  const dy = target.y - current.y;

  // Simplified pathfinding - move in x direction first, then y
  if (dx > 0) {
    moves.push(...Array(dx).fill('right'));
  } else if (dx < 0) {
    moves.push(...Array(-dx).fill('left'));
  }

  if (dy > 0) {
    moves.push(...Array(dy).fill('down'));
  } else if (dy < 0) {
    moves.push(...Array(-dy).fill('up'));
  }

  return moves;
}

function isNearTarget(current: Position, target: { x: number; y: number }): boolean {
  // For exact movement commands, we want exact position matching
  return current.x === target.x && current.y === target.y;
}

export const loader: LoaderFunction = async ({ request }) => {
  // Check for token in Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { 
      status: 401 
    }); 
  }

  return json({ 
    success: true,
    message: "Send a POST request with 'botId' and 'message' fields to start an agentic response."
  });
};

export const action: ActionFunction = async ({ request }) => {
  console.log('[webhook] Received webhook request');
  
  if (request.method !== 'POST') {
    console.log('[webhook] Rejected non-POST request');
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Check for token in Authorization header
  const authHeader = request.headers.get('Authorization');
  const providedToken = authHeader?.replace('Bearer ', '');
  
  if (!providedToken) {
    console.log('[webhook] Missing authorization token');
    return json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { 
      status: 401 
    }); 
  }

  try {
    // Parse request body
    const body = await request.json();
    const { message, botId } = body;
    
    console.log('[webhook] Request body:', { message, botId });
    
    if (!botId) {
      console.log('[webhook] Missing botId');
      return json({ 
        success: false, 
        error: 'Bot ID is required' 
      }, { 
        status: 400 
      });
    }

    if (!message || typeof message !== 'string') {
      console.log('[webhook] Invalid or missing message');
      return json({ 
        success: false, 
        error: 'Message text is required' 
      }, { 
        status: 400 
      });
    }

    // Get bot profile
    console.log('[webhook] Fetching bot profile for:', botId);
    const bot = await getUserProfile(botId);
    if (!bot) {
      console.log('[webhook] Bot not found:', botId);
      return json({ 
        success: false, 
        error: 'Bot not found' 
      }, { 
        status: 404 
      });
    }

    if (!bot.isBot) {
      console.log('[webhook] ID is not a bot:', botId);
      return json({ 
        success: false, 
        error: 'The provided ID is not a bot' 
      }, { 
        status: 400 
      });
    }

    // Verify the provided token matches the bot's token
    if (!bot.token || providedToken !== bot.token) {
      console.log('[webhook] Invalid token for bot:', botId);
      return json({ 
        success: false, 
        error: 'Invalid token' 
      }, { 
        status: 401 
      });
    }

    console.log('[webhook] Bot authentication successful:', botId);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Start the action loop
    let actionCount = 0;
    let currentTask: Task = {
      type: 'send_message',
      message: 'I received your message. Let me help you with that.',
      originalMessage: message
    };
    
    const actions: any[] = [];
    let lastActionResult: any = null;
    console.log('[webhook] Starting action loop with initial message');

    while (actionCount < MAX_ACTIONS && currentTask.type !== 'end') {
      actionCount++;
      console.log(`[webhook] Starting action iteration ${actionCount}`);
      
      // Get current environment state
      console.log('[webhook] Fetching environment state');
      const state = await seeEnvironment(botId, providedToken);
      if (!state.success) {
        console.log('[webhook] Failed to get environment state:', state);
        return json({ 
          success: false, 
          error: 'Failed to get environment state',
          actions 
        });
      }
      console.log('[webhook] Current state:', {
        position: state.position,
        playerCount: state.players.length
      });

      // Execute current task
      let actionResult;
      console.log('[webhook] Executing task:', currentTask.type);
      
      switch (currentTask.type) {
        case 'move_to_player': {
          const targetPlayer = state.players.find(p => p.id === currentTask.targetId);
          if (!targetPlayer) {
            console.log('[webhook] Target player not found:', currentTask.targetId);
            actionResult = { success: false, error: 'Target player not found' };
            break;
          }
          
          if (isNearTarget(state.position, targetPlayer)) {
            console.log('[webhook] Already near target player');
            actionResult = { success: true, message: 'Already near target player' };
          } else {
            console.log('[webhook] Calculating moves to reach player:', {
              from: state.position,
              to: targetPlayer
            });
            const moves = calculateMoves(state.position, targetPlayer);
            console.log('[webhook] Executing moves:', moves.slice(0, 5));
            actionResult = await moveBot(botId, providedToken, moves.slice(0, 5));
          }
          break;
        }
        
        case 'move_to_coords': {
          if (!currentTask.targetCoords) {
            console.log('[webhook] No target coordinates provided');
            actionResult = { success: false, error: 'No target coordinates provided' };
            break;
          }
          
          if (isNearTarget(state.position, currentTask.targetCoords)) {
            console.log('[webhook] Already at target location');
            actionResult = { success: true, message: 'Already at target location' };
          } else {
            console.log('[webhook] Calculating moves to reach coordinates:', {
              from: state.position,
              to: currentTask.targetCoords
            });
            const moves = calculateMoves(state.position, currentTask.targetCoords);
            console.log('[webhook] Executing moves:', moves.slice(0, 5));
            actionResult = await moveBot(botId, providedToken, moves.slice(0, 5));
          }
          break;
        }
        
        case 'send_message': {
          if (!currentTask.message) {
            console.log('[webhook] No message provided');
            actionResult = { success: false, error: 'No message provided' };
            break;
          }
          console.log('[webhook] Sending message:', {
            message: currentTask.message,
            targetId: currentTask.targetId
          });
          actionResult = await sendMessage(botId, providedToken, currentTask.message, currentTask.targetId);
          break;
        }
        
        default:
          console.log('[webhook] No action needed for type:', currentTask.type);
          actionResult = { success: true, message: 'No action needed' };
      }

      console.log('[webhook] Action result:', actionResult);
      lastActionResult = actionResult;

      // Record the action
      actions.push({
        type: currentTask.type,
        result: actionResult
      });

      // Determine next action
      console.log('[webhook] Determining next action');
      currentTask = await determineNextAction(currentTask.originalMessage, state, openai, lastActionResult);
      console.log('[webhook] Next task determined:', currentTask.type);
    }

    console.log('[webhook] Action loop complete', {
      actionCount,
      complete: currentTask.type === 'end' || actionCount >= MAX_ACTIONS
    });

    // Return summary of all actions taken
    return json({ 
      success: true,
      actionCount,
      actions,
      complete: currentTask.type === 'end' || actionCount >= MAX_ACTIONS
    });

  } catch (error: any) {
    console.error('[webhook] Error in agentic webhook:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to process message' 
    }, { 
      status: 500 
    });
  }
}; 