import { json } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getUserProfile } from '~/lib/user';
import OpenAI from 'openai';

export const loader: LoaderFunction = async ({ request, params }) => {
  // Check for admin token in Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader;
  
  if (!token || token !== 'master-of-bots') {
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
    // Get bot profile to check if it exists
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

    return json({ 
      success: true,
      bot: {
        id: bot.uid,
        name: bot.name,
        position: {
          x: bot.x,
          y: bot.y,
          direction: bot.direction
        }
      },
      message: "Send a POST request with a 'message' field to receive a response from this bot."
    });
  } catch (error: any) {
    console.error('Error getting bot information:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to get bot information' 
    }, { 
      status: 500 
    });
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Check for admin token in Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader;
  
  if (!token || token !== 'master-of-bots') {
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
    // Parse request body for message text
    const body = await request.json();
    const { message } = body;
    
    if (!message || typeof message !== 'string') {
      return json({ 
        success: false, 
        error: 'Message text is required' 
      }, { 
        status: 400 
      });
    }

    // Get bot profile to check if it exists
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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare the message for OpenAI
    const prompt = `
You are a bot named "${bot.name}" in a virtual world. Please respond to the following message from a user:

${message}

Keep your response concise and in character. You are a helpful assistant in this virtual world.
`;

    // Make the API call to GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a bot named "${bot.name}" in a virtual world. You are helpful and concise in your responses.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 150, // Keep responses reasonably short for a chat
    });

    // Extract the response text
    const responseText = response.choices[0]?.message?.content || "I couldn't process that message.";

    return json({ 
      success: true,
      botId: bot.uid,
      botName: bot.name,
      message: message,
      response: responseText
    });
  } catch (error: any) {
    console.error('Error processing message with OpenAI:', error);
    return json({ 
      success: false, 
      error: error.message || 'Failed to process message' 
    }, { 
      status: 500 
    });
  }
}; 