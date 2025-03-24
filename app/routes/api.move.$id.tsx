import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { moveBotPlayer, getBotView } from '~/lib/user';
import { ref, update } from '~/lib/firebase';
import { database } from '~/lib/firebase';

type Direction = 'right' | 'up' | 'left' | 'down';

// Sleep helper function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to log a visual map diagram with bot position
function logMapDiagram(position: { x: number, y: number, direction: string }, collisionMap?: number[][]) {
  console.log(`\n🤖 Bot at (${position.x},${position.y}) facing ${position.direction}`);
  
  // If no collision map is provided, just log the position
  if (!collisionMap) {
    console.log('(No map data available)');
    return;
  }
  
  console.log('\n🗺️  Collision Map (60x40):\n');
  
  // Print the map with bot position
  for (let y = 0; y < collisionMap.length; y++) {
    let row = '';
    for (let x = 0; x < collisionMap[y].length; x++) {
      if (x === position.x && y === position.y) {
        // Mark bot position with 'x'
        row += 'x';
      } else {
        // Just output the collision value (0 or 1)
        row += collisionMap[y][x];
      }
    }
    console.log(row);
  }
  
  console.log('\n'); // Add empty line for spacing
}

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
    // Parse request body for moves array
    const body = await request.json();
    const moves = body.moves;
    
    if (!Array.isArray(moves)) {
      return json({ 
        success: false, 
        error: 'Moves must be an array' 
      }, { 
        status: 400 
      });
    }

    // Validate all moves are valid directions
    const validDirections = new Set(['right', 'up', 'left', 'down']);
    if (!moves.every(move => validDirections.has(move))) {
      return json({ 
        success: false, 
        error: 'Invalid direction in moves array. Valid directions are: right, up, left, down' 
      }, { 
        status: 400 
      });
    }

    console.log(`\n🤖 Moving bot ${id} with ${moves.length} moves: ${moves.join(', ')}`);

    // Set initial moving state to true
    const playerRef = ref(database, `players/${id}`);
    await update(playerRef, { moving: true });

    // Get initial view to have the collision map
    let collisionMap: number[][] | undefined;
    try {
      const view = await getBotView(id);
      collisionMap = view.map;
    } catch (error) {
      console.warn('Could not get initial collision map:', error);
      // Continue without the map - the visual display will be limited
    }

    // Execute moves sequentially with delay
    let lastPosition = null;
    for (const move of moves as Direction[]) {
      // Add a 200ms delay between moves
      await sleep(200);
      
      const result = await moveBotPlayer(id, move);
      
      // Log move attempt
      console.log(`Move ${move}: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
      
      // Log visual map if we have position data
      if (result.position) {
        // Since the move result doesn't include the map, we'll use our stored map
        // or try to retrieve a fresh view if needed
        logMapDiagram(result.position, collisionMap);
      }
      
      if (!result.success) {
        // Set moving to false on failure
        await update(playerRef, { moving: false });
        console.log(`❌ Movement failed: ${result.error}`);
        return json({
          success: false,
          error: result.error,
          completedMoves: moves.slice(0, moves.indexOf(move)),
          failedMove: move,
          remainingMoves: moves.slice(moves.indexOf(move) + 1),
          currentPosition: result.position
        });
      }
      
      lastPosition = result.position;
    }
    
    // Set final moving state to false
    await update(playerRef, { moving: false });
    
    console.log(`✅ All moves completed successfully. Final position: (${lastPosition?.x}, ${lastPosition?.y})`);
    
    return json({ 
      success: true,
      moves: moves,
      finalPosition: lastPosition
    });
  } catch (error: any) {
    // Ensure moving state is set to false on error
    try {
      const playerRef = ref(database, `players/${id}`);
      await update(playerRef, { moving: false });
    } catch (e) {
      console.error('Failed to reset moving state:', e);
    }

    console.error('Error moving bot player:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to move bot player' 
    }, { 
      status: error.message === 'Not a bot' ? 400 : 500 
    });
  }
}; 