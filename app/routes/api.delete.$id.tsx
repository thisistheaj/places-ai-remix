import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { deleteBotPlayer } from '~/lib/user';

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== 'POST' && request.method !== 'DELETE') {
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
    await deleteBotPlayer(id);
    
    return json({ 
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting bot player:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to delete bot player' 
    }, { 
      status: error.message === 'Not a bot' ? 400 : 500 
    });
  }
}; 