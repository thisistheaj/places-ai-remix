import { json } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getUserProfile } from '~/lib/user';
import OpenAI from 'openai';
import fetch from 'node-fetch';

export const loader: LoaderFunction = async ({ request }) => {
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

  try {
    return json({ 
      success: true,
      message: "Send a POST request with 'botId' and 'message' fields to receive a response from a bot."
    });
  } catch (error: any) {
    console.error('Error:', error);
    return json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { 
      status: 500 
    });
  }
};

export const action: ActionFunction = async ({ request }) => {
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

  try {
    // Parse request body for message text and source user ID
    const body = await request.json();
    const { message, sourceUserId, botId } = body;
    
    if (!botId) {
      return json({ 
        success: false, 
        error: 'Bot ID is required' 
      }, { 
        status: 400 
      });
    }

    if (!message || typeof message !== 'string') {
      return json({ 
        success: false, 
        error: 'Message text is required' 
      }, { 
        status: 400 
      });
    }

    // Get bot profile to check if it exists
    const bot = await getUserProfile(botId);
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

    // Now send the bot's response using the /send endpoint
    const sendUrl = 'https://aihacker.house/api/send/' + bot.uid;
    const sendPayload = {
      text: responseText,
      // If sourceUserId is provided, send back to the user as a DM
      ...(sourceUserId ? { targetUserId: sourceUserId } : {})
    };

    // Send the message
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(sendPayload)
    });

    const sendResult = await sendResponse.json();

    // Return both the AI-generated response and the send endpoint result
    return json({ 
      success: true,
      botId: bot.uid,
      botName: bot.name,
      userMessage: message,
      botResponse: responseText,
      messageSent: sendResult.success,
      messageDetails: sendResult.message
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