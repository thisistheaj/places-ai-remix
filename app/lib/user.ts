import { User } from 'firebase/auth';
import { ref, set, get, remove, update } from 'firebase/database';
import { database } from './firebase';
import { Player } from '~/models/player';
import { setupPresenceTracking } from './firebase';
import { nanoid } from 'nanoid';

const BOT_NAMES = [
  'Assistant',
  'Helper',
  'Guide',
  'Companion',
  'Advisor',
  'Mentor',
  'Buddy',
  'Aide',
  'Support',
  'Coach'
];

// Match the game map dimensions from the tilemap
const MAP_WIDTH = 60;
const MAP_HEIGHT = 40;

// Create a collision data structure that matches the game's collision system
// This represents all the tiles that have collisions in them
// 0 = walkable, 1 = collision
const COLLISION_MAP = `
111111111111111111111111111111111111111111111111111111111111
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000001111111100000000000000000000000001
100000000000000000000000001000000100000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000000000011111111111111111111110000000000000000001
100011000000001100010000000000100000000010000000011000000001
100011000110001100010000000000100000000010001100011000110001
100010000110000000000000000000100000000000001100000000110001
100010000000000000000001111000100111100000000000000000000001
100011000000001100000001111000100111100000000000011000000001
100011000110001100010000000000100000000010001100011000110001
100000000110000000010000000000100000000010001100000000110001
100000000000000000010000000000100000000010000000000000000001
100011000000001100010000000000100000000010000000011000000001
100011000110001100011111111111111111111110001100011000110001
100000000110000000010000000000100000000010001100000000110001
100000000000000000010000000000100000000010000000000000000001
100011000000001100010000000000100000000010000000011000000001
100011000110001100000001111000100111100000001100011000110001
100000000110000000000001111000100111100000001100000000110001
100000000000000000000000000000100000000000000000000000000001
100011000000001100010000000000100000000010000000011000000001
100011000110001100010000000000100000000010001100011000110001
100000000110000000010000000000100000000010001100000000110001
100000000000000000011111111111111111111110000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000111000000000010011110010000000000000000011100001
100011100000111000000000010011110010000000001110000011100001
100011100000111000000000000000000000000000001110000011100001
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
100000000000000000000000000000000000000000000000000000000001
111111111111111111111111111111111111111111111111111111111111
`.split('\n').map(row => row.split('').map(Number));

// Utility function to check if a position is blocked
function isPositionBlocked(x: number, y: number): boolean {
  // Out of bounds check
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return true;
  }
  
  // Check the collision map
  return COLLISION_MAP[y][x] === 1;
}

interface BotCreationProps {
  name?: string;
  x?: number;
  y?: number;
  direction?: 'right' | 'up' | 'left' | 'down';
  skin?: string;
}

interface BotUpdateProps {
  name?: string;
  skin?: string;
}

interface MoveResult {
  success: boolean;
  error?: string;
  position?: {
    x: number;
    y: number;
    direction: 'right' | 'up' | 'left' | 'down';
  };
}

interface MapData {
  position: {
    x: number;
    y: number;
    direction: 'right' | 'up' | 'left' | 'down';
  };
  map: number[][];
}

// Create or update user profile
export const createOrUpdateUserProfile = async (user: User): Promise<Player> => {
  try {
    const userRef = ref(database, `players/${user.uid}`);
    const snapshot = await get(userRef);
    
    // Check if user profile already exists
    if (snapshot.exists()) {
      // Update lastSeenAt timestamp
      const existingData = snapshot.val() as Player;
      const updatedData: Partial<Player> = {
        lastSeenAt: Date.now()
      };
      
      await set(userRef, { ...existingData, ...updatedData });
      
      // Set up presence tracking after profile is updated
      setupPresenceTracking(user.uid);
      
      return { ...existingData, ...updatedData } as Player;
    } else {
      // Create new user profile with default values
      const newUserData = createDefaultPlayerData(user.uid, user.displayName || user.email?.split('@')[0] || 'Anonymous');
      
      await set(userRef, newUserData);
      
      // Set up presence tracking after profile is created
      setupPresenceTracking(user.uid);
      
      return newUserData;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Create a bot player
export const createBotPlayer = async (props?: BotCreationProps): Promise<Player> => {
  try {
    const botId = `bot_${nanoid(10)}`;
    
    // Create bot profile using same default data generator, but override with any provided props
    const botData = createDefaultPlayerData(
      botId, 
      props?.name || generateBotName(), 
      true,
      {
        x: props?.x,
        y: props?.y,
        direction: props?.direction,
        skin: props?.skin
      }
    );
    
    // Store in players collection
    const playerRef = ref(database, `players/${botId}`);
    await set(playerRef, botData);
    
    // Add to bots list
    const botRef = ref(database, `bots/${botId}`);
    await set(botRef, true);
    
    // Set up presence tracking
    setupPresenceTracking(botId);
    
    return botData;
  } catch (error) {
    console.error('Error creating bot player:', error);
    throw error;
  }
};

// Update a bot's non-position properties
export const updateBotPlayer = async (botId: string, props: BotUpdateProps): Promise<Player> => {
  try {
    // First check if it's a bot
    const botRef = ref(database, `bots/${botId}`);
    const botSnapshot = await get(botRef);
    if (!botSnapshot.exists()) {
      throw new Error('Not a bot');
    }

    // Get current player data
    const playerRef = ref(database, `players/${botId}`);
    const playerSnapshot = await get(playerRef);
    if (!playerSnapshot.exists()) {
      throw new Error('Bot not found');
    }

    const currentData = playerSnapshot.val() as Player;
    
    // Update only allowed properties, preserve all others exactly as they are
    await set(playerRef, {
      ...currentData,
      name: props.name ?? currentData.name,
      skin: props.skin ?? currentData.skin,
      lastSeenAt: Date.now()
    });

    // Return the updated data
    return {
      ...currentData,
      name: props.name ?? currentData.name,
      skin: props.skin ?? currentData.skin,
      lastSeenAt: Date.now()
    };
  } catch (error) {
    console.error('Error updating bot player:', error);
    throw error;
  }
};

// Delete a bot and its messages
export const deleteBotPlayer = async (botId: string): Promise<void> => {
  try {
    // First check if it's a bot
    const botRef = ref(database, `bots/${botId}`);
    const botSnapshot = await get(botRef);
    if (!botSnapshot.exists()) {
      throw new Error('Not a bot');
    }

    // Delete from players collection
    const playerRef = ref(database, `players/${botId}`);
    await remove(playerRef);

    // Delete from bots collection
    await remove(botRef);

    // Delete DM messages
    const dmRef = ref(database, `messages/dm/${botId}`);
    await remove(dmRef);

  } catch (error) {
    console.error('Error deleting bot player:', error);
    throw error;
  }
};

interface DefaultPlayerDataOverrides {
  x?: number;
  y?: number;
  direction?: 'right' | 'up' | 'left' | 'down';
  skin?: string;
}

// Helper function to generate default player data (used for both users and bots)
function createDefaultPlayerData(
  uid: string, 
  name: string, 
  isBot: boolean = false,
  overrides: DefaultPlayerDataOverrides = {}
): Player {
  const defaultX = Math.floor(Math.random() * 15) + 5; // Random position between 5-20
  const defaultY = Math.floor(Math.random() * 15) + 5;
  const defaultColor = Math.floor(Math.random() * 0xFFFFFF); // Random color
  const defaultSkin = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
  const defaultDirection = ['right', 'up', 'left', 'down'][Math.floor(Math.random() * 4)] as 'right' | 'up' | 'left' | 'down';
  
  return {
    uid,
    name,
    x: overrides.x ?? defaultX,
    y: overrides.y ?? defaultY,
    color: defaultColor,
    direction: overrides.direction ?? defaultDirection,
    moving: false,
    room: null,
    lastSeenAt: Date.now(),
    skin: overrides.skin ?? defaultSkin,
    isBot
  };
}

function generateBotName(): string {
  const randomName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  return `${randomName}${randomNumber}`;
}

// Get user profile
export const getUserProfile = async (uid: string): Promise<Player | null> => {
  try {
    const userRef = ref(database, `players/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Player;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Validate and execute a single move for a bot
export const moveBotPlayer = async (
  botId: string, 
  direction: 'right' | 'up' | 'left' | 'down'
): Promise<MoveResult> => {
  try {
    // First check if it's a bot
    const botRef = ref(database, `bots/${botId}`);
    const botSnapshot = await get(botRef);
    if (!botSnapshot.exists()) {
      throw new Error('Not a bot');
    }

    // Get current player data
    const playerRef = ref(database, `players/${botId}`);
    const playerSnapshot = await get(playerRef);
    if (!playerSnapshot.exists()) {
      throw new Error('Bot not found');
    }

    const currentData = playerSnapshot.val() as Player;
    
    // Calculate new position
    let newX = currentData.x;
    let newY = currentData.y;
    
    switch (direction) {
      case 'up':
        newY--;
        break;
      case 'down':
        newY++;
        break;
      case 'left':
        newX--;
        break;
      case 'right':
        newX++;
        break;
    }

    // Check if position is blocked using our utility function
    if (isPositionBlocked(newX, newY)) {
      return {
        success: false,
        error: 'Position is blocked',
        position: {
          x: currentData.x,
          y: currentData.y,
          direction: currentData.direction
        }
      };
    }

    // Update position in Firebase
    const updates = {
      x: newX,
      y: newY,
      direction,
      lastSeenAt: Date.now()
    };

    await update(playerRef, updates);

    return {
      success: true,
      position: {
        x: newX,
        y: newY,
        direction
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      position: error.message === 'Not a bot' ? undefined : {
        x: (error as any).currentPosition?.x,
        y: (error as any).currentPosition?.y,
        direction: (error as any).currentPosition?.direction
      }
    };
  }
};

// Get bot position and map data
export const getBotView = async (botId: string): Promise<MapData> => {
  try {
    // First check if it's a bot
    const botRef = ref(database, `bots/${botId}`);
    const botSnapshot = await get(botRef);
    if (!botSnapshot.exists()) {
      throw new Error('Not a bot');
    }

    // Get current player data
    const playerRef = ref(database, `players/${botId}`);
    const playerSnapshot = await get(playerRef);
    if (!playerSnapshot.exists()) {
      throw new Error('Bot not found');
    }

    const currentData = playerSnapshot.val() as Player;
    
    return {
      position: {
        x: currentData.x,
        y: currentData.y,
        direction: currentData.direction
      },
      map: COLLISION_MAP
    };
  } catch (error) {
    console.error('Error getting bot view:', error);
    throw error;
  }
}; 