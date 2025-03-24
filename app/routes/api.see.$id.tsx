import { json } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getBotView } from '~/lib/user';

// Function to log a visual map diagram with bot position
function logMapDiagram(map: number[][], position: { x: number, y: number, direction: string }) {
  console.log(`\n🤖 Bot at (${position.x},${position.y}) facing ${position.direction}`);
  console.log('\n🗺️  Collision Map (60x40):\n');
  
  // Print the map with bot position
  for (let y = 0; y < map.length; y++) {
    let row = '';
    for (let x = 0; x < map[y].length; x++) {
      if (x === position.x && y === position.y) {
        // Mark bot position with 'x'
        row += 'x';
      } else {
        // Just output the collision value (0 or 1)
        row += map[y][x];
      }
    }
    console.log(row);
  }
  
  console.log('\n'); // Add empty line for spacing
}

// This endpoint supports both GET and POST
export const action: ActionFunction = async ({ request, params }) => {
  return handleRequest(request, params);
};

export const loader: LoaderFunction = async ({ request, params }) => {
  return handleRequest(request, params);
};

async function handleRequest(request: Request, params: any) {
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
    const view = await getBotView(id);
    
    // Log a visual representation of the map with the bot's position
    if (view.position && view.map) {
      logMapDiagram(view.map, view.position);
    }
    
    return json({ 
      success: true,
      ...view
    });
  } catch (error: any) {
    console.error('Error getting bot view:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to get bot view' 
    }, { 
      status: error.message === 'Not a bot' ? 400 : 500 
    });
  }
} 