import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { updateBotPlayer } from '~/lib/user';

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== 'POST' && request.method !== 'PUT') {
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
    // Parse request body for optional properties
    const body = await request.json().catch(() => ({}));
    
    // Type check and validate the input properties
    const props = {
      name: typeof body.name === 'string' ? body.name : undefined,
      skin: typeof body.skin === 'string' && /^\d{2}$/.test(body.skin) && 
            parseInt(body.skin) >= 1 && parseInt(body.skin) <= 20 ? body.skin : undefined
    };

    // Update the bot
    const player = await updateBotPlayer(id, props);
    
    return json({ 
      success: true,
      player
    });
  } catch (error: any) {
    console.error('Error updating bot player:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to update bot player' 
    }, { 
      status: error.message === 'Not a bot' ? 400 : 500 
    });
  }
}; 