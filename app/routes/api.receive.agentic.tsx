import { json } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getUserProfile } from '~/lib/user';
import OpenAI from 'openai';
import fetch from 'node-fetch';

// Constants
const MAX_ACTIONS = 10; // Maximum number of actions before auto-terminating
const PROXIMITY_THRESHOLD = 3; // How close we need to be to consider "near" a target
const GITHUB_API_BASE = 'https://api.github.com';

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
  type: 'move_to_player' | 'move_to_coords' | 'send_message' | 'end' | 'github_pr' | 'github_repo' | 'github_issues';
  targetId?: string;
  targetCoords?: { x: number; y: number };
  message?: string;
  originalMessage: string;
  owner?: string;
  repo?: string;
  state?: string;
}

interface GitHubPR {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
  };
}

interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
}

interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  user: {
    login: string;
  };
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

// GitHub API helper functions
async function getLatestPR(owner: string, repo: string): Promise<GitHubPR | null> {
  console.log('[github] Fetching latest PR for', owner, repo);
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=all&sort=created&direction=desc&per_page=1`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'places-ai-bot'
        }
      }
    );
    
    if (!response.ok) {
      console.log('[github] Failed to fetch PR:', response.status);
      return null;
    }

    const prs = await response.json();
    return prs[0] || null;
  } catch (error) {
    console.error('[github] Error fetching PR:', error);
    return null;
  }
}

async function getRepoInfo(owner: string, repo: string): Promise<GitHubRepo | null> {
  console.log('[github] Fetching repo info for', owner, repo);
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'places-ai-bot'
        }
      }
    );
    
    if (!response.ok) {
      console.log('[github] Failed to fetch repo:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[github] Error fetching repo:', error);
    return null;
  }
}

async function getLatestIssues(owner: string, repo: string, state: string = 'open'): Promise<GitHubIssue[]> {
  console.log('[github] Fetching issues for', owner, repo);
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=${state}&sort=created&direction=desc&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'places-ai-bot'
        }
      }
    );
    
    if (!response.ok) {
      console.log('[github] Failed to fetch issues:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[github] Error fetching issues:', error);
    return [];
  }
}

async function determineNextAction(
  message: string,
  currentState: SeeResponse,
  openai: OpenAI,
  lastActionResult?: any,
  githubData?: any // Store GitHub data between actions
): Promise<Task> {
  console.log('[determineNextAction] Starting with message:', message);
  console.log('[determineNextAction] Current state:', {
    position: currentState.position,
    playerCount: currentState.players.length,
    lastActionResult,
    githubData
  });

  // Handle direct movement commands
  const moveMatch = message.match(/move (up|down|left|right) (\d+)/i);
  if (moveMatch) {
    const [_, direction, squares] = moveMatch;
    const targetCoords = { ...currentState.position };
    const amount = parseInt(squares);

    switch (direction.toLowerCase()) {
      case 'up':
        targetCoords.y -= amount;
        break;
      case 'down':
        targetCoords.y += amount;
        break;
      case 'left':
        targetCoords.x -= amount;
        break;
      case 'right':
        targetCoords.x += amount;
        break;
    }

    if (isNearTarget(currentState.position, targetCoords)) {
      return {
        type: 'send_message',
        message: 'I have completed the movement.',
        originalMessage: message
      };
    }

    return {
      type: 'move_to_coords',
      targetCoords,
      originalMessage: message
    };
  }

  // For all other cases, use GPT-4 to determine the action
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an AI that determines the next action for a bot in a virtual space.
You must analyze the user's message and current state to decide the next action.

Available actions:
1. Move to a player (type: move_to_player, needs targetId)
2. Move to coordinates (type: move_to_coords, needs targetCoords)
3. Send a message (type: send_message, needs message and optionally targetId)
4. End the sequence (type: end)

For GitHub interactions, you can request:
1. Latest PR info (type: github_pr, needs owner and repo)
2. Repository info (type: github_repo, needs owner and repo)
3. Latest issues (type: github_issues, needs owner and repo, optional state)

Key behaviors:
1. For GitHub-related requests:
   - First request the appropriate GitHub data
   - Once data is received, either:
     a. Send a message with the information
     b. Move to a player to deliver the information

2. For direct questions or conversations:
   - Respond with a message to the asking player
   - Then end the sequence

3. For message delivery requests:
   - First move to the target player
   - Once near them, deliver the message
   - Then end the sequence

You must respond with ONLY a JSON object containing the action details, nothing else.
Example responses:
{"type": "github_pr", "owner": "thisistheaj", "repo": "places-ai-remix"}
{"type": "github_issues", "owner": "thisistheaj", "repo": "places-ai-remix", "state": "open"}
{"type": "move_to_player", "targetId": "user123"}
{"type": "send_message", "message": "Here's what I found...", "targetId": "user123"}`
      },
      {
        role: "user",
        content: `Message: "${message}"
Current position: ${JSON.stringify(currentState.position)}
Nearby players: ${JSON.stringify(currentState.players)}
Last action result: ${JSON.stringify(lastActionResult)}
GitHub data: ${JSON.stringify(githubData)}
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

    // Handle GitHub tool calls
    if (action.type === 'github_pr') {
      const pr = await getLatestPR(action.owner, action.repo);
      return determineNextAction(message, currentState, openai, lastActionResult, { type: 'pr', data: pr });
    }
    
    if (action.type === 'github_repo') {
      const repo = await getRepoInfo(action.owner, action.repo);
      return determineNextAction(message, currentState, openai, lastActionResult, { type: 'repo', data: repo });
    }
    
    if (action.type === 'github_issues') {
      const issues = await getLatestIssues(action.owner, action.repo, action.state);
      return determineNextAction(message, currentState, openai, lastActionResult, { type: 'issues', data: issues });
    }
    
    // Handle movement and message actions
    if (action.type === 'move_to_player' && lastActionResult?.message === 'Already near target player') {
      return {
        type: 'send_message',
        message: action.message || 'I have reached the target player.',
        targetId: action.targetId,
        originalMessage: message
      };
    }
    
    // After successfully sending a message, end the sequence
    if (action.type === 'send_message' && lastActionResult?.success && lastActionResult?.message?.text === action.message) {
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