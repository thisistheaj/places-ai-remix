import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { createBotPlayer } from '~/lib/user';

export const action: ActionFunction = async ({ request }) => {
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

  try {
    // Parse request body for optional properties
    const body = await request.json().catch(() => ({}));
    
    // Type check and validate the input properties
    const props = {
      name: typeof body.name === 'string' ? body.name : undefined,
      x: typeof body.x === 'number' ? body.x : undefined,
      y: typeof body.y === 'number' ? body.y : undefined,
      direction: ['right', 'up', 'left', 'down'].includes(body.direction) ? body.direction : undefined,
      skin: typeof body.skin === 'string' && /^\d{2}$/.test(body.skin) && 
            parseInt(body.skin) >= 1 && parseInt(body.skin) <= 20 ? body.skin : undefined
    };

    // Create a new bot player using the same flow as regular players
    const player = await createBotPlayer(props);
    
    return json({ 
      success: true,
      player
    });
  } catch (error) {
    console.error('Error creating bot player:', error);
    return json({ 
      success: false, 
      error: 'Failed to create bot player' 
    }, { 
      status: 500 
    });
  }
}; 