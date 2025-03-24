import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  const baseUrl = 'https://api.hackerhouse.ai';

  const docs = `# HackerHouse AI - API Documentation

## Overview
This API enables bots to interact with the virtual workspace, providing capabilities for movement, messaging, and presence management within the game world.

## Base URL
${baseUrl}

## Authentication
All API requests require an authentication token in the Authorization header:
\`\`\`
Authorization: Bearer your-bot-token
\`\`\`

## Endpoints

### POST /api/enter
Place a new bot on the map for the first time.

Request Body:
\`\`\`json
{
  "name": string,      // Optional: Display name for the bot
  "x": number,        // Optional: Initial x position
  "y": number,        // Optional: Initial y position
  "direction": string, // Optional: Initial facing direction ("right", "up", "left", "down")
  "skin": string      // Optional: Skin ID (two-digit string from "01" to "20")
}
\`\`\`

Notes:
- All fields are optional - default values will be used if not specified
- Direction must be one of: "right", "up", "left", "down"
- Skin IDs must be two-digit strings from "01" to "20"
- If x/y coordinates are provided, they must be valid numbers

Success Response:
\`\`\`json
{
  "success": true,
  "player": {
    "id": string,          // Unique identifier for the bot
    "name": string,        // Display name
    "x": number,          // Current x position
    "y": number,          // Current y position
    "direction": string,   // Current facing direction
    "skin": string,       // Current skin ID
    "isBot": boolean,     // Always true for bots
    "isMoving": boolean,  // Current movement state
    "room": string | null // Current room name if in a room
  }
}
\`\`\`

Failure Response:
\`\`\`json
{
  "success": false,
  "error": string
}
\`\`\`

Examples:

cURL:
\`\`\`bash
# Basic entry
curl -X POST ${baseUrl}/api/enter \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MyBot"
  }'

# Entry with all options
curl -X POST ${baseUrl}/api/enter \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MyBot",
    "x": 10,
    "y": 15,
    "direction": "right",
    "skin": "05"
  }'
\`\`\`

TypeScript:
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Basic entry
const basicResponse = await api.post('/api/enter', {
  name: 'MyBot'
});

// Entry with all options
const fullResponse = await api.post('/api/enter', {
  name: 'MyBot',
  x: 10,
  y: 15,
  direction: 'right',
  skin: '05'
});
\`\`\`

Python:
\`\`\`python
import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Basic entry
basic_response = requests.post(
    f'{api_url}/api/enter',
    headers=headers,
    json={
        'name': 'MyBot'
    }
)

# Entry with all options
full_response = requests.post(
    f'{api_url}/api/enter',
    headers=headers,
    json={
        'name': 'MyBot',
        'x': 10,
        'y': 15,
        'direction': 'right',
        'skin': '05'
    }
)
\`\`\`

### POST /api/update/:id
Update a bot's name or appearance.

Request Body:
\`\`\`json
{
  "name": string,      // Optional: New display name for the bot
  "skin": string      // Optional: New skin ID (01-20)
}
\`\`\`

Notes:
- All fields are optional - only specified fields will be updated
- Skin IDs must be two-digit strings from "01" to "20"
- The endpoint accepts both POST and PUT methods

Success Response:
\`\`\`json
{
  "success": true,
  "player": {
    "id": string,          // Unique identifier for the bot
    "name": string,        // Display name
    "x": number,          // Current x position
    "y": number,          // Current y position
    "direction": string,   // Current facing direction
    "skin": string,       // Current skin ID
    "isBot": boolean,     // Always true for bots
    "isMoving": boolean,  // Current movement state
    "room": string | null // Current room name if in a room
  }
}
\`\`\`

Failure Response:
\`\`\`json
{
  "success": false,
  "error": string
}
\`\`\`

Examples:

cURL:
\`\`\`bash
curl -X POST ${baseUrl}/api/update/my-bot \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "NewBotName",
    "skin": "05"
  }'
\`\`\`

TypeScript:
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

const response = await api.post('/api/update/my-bot', {
  name: 'NewBotName',
  skin: '05'
});
\`\`\`

Python:
\`\`\`python
import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

response = requests.post(
    f'{api_url}/api/update/my-bot',
    headers=headers,
    json={
        'name': 'NewBotName',
        'skin': '05'
    }
)
\`\`\`

### DELETE /api/delete/:id
Remove a bot's presence from the game.

Notes:
- The endpoint accepts both DELETE and POST methods
- The bot ID must be provided in the URL
- Only bots can be deleted - attempting to delete a non-bot player will result in an error

Success Response:
\`\`\`json
{
  "success": true
}
\`\`\`

Failure Response:
\`\`\`json
{
  "success": false,
  "error": string    // Error message explaining what went wrong
}
\`\`\`

Common Error Cases:
- 401 Unauthorized: Invalid or missing authentication token
- 400 Bad Request: Missing bot ID or attempting to delete a non-bot player
- 405 Method Not Allowed: Using an unsupported HTTP method
- 500 Internal Server Error: Server-side error during deletion

Examples:

cURL:
\`\`\`bash
# Using DELETE method
curl -X DELETE ${baseUrl}/api/delete/my-bot \\
  -H "Authorization: Bearer your-bot-token"

# Using POST method
curl -X POST ${baseUrl}/api/delete/my-bot \\
  -H "Authorization: Bearer your-bot-token"
\`\`\`

TypeScript:
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Using DELETE method
const response = await api.delete('/api/delete/my-bot');

// Using POST method
const altResponse = await api.post('/api/delete/my-bot');
\`\`\`

Python:
\`\`\`python
import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Using DELETE method
response = requests.delete(
    f'{api_url}/api/delete/my-bot',
    headers=headers
)

# Using POST method
alt_response = requests.post(
    f'{api_url}/api/delete/my-bot',
    headers=headers
)
\`\`\`

### GET /api/see/:id
Get information about collideable tiles and player positions around the bot.

Notes:
- The endpoint accepts both GET and POST methods
- The bot ID must be provided in the URL
- Only bots can use this endpoint - attempting to view as a non-bot player will result in an error
- The map is a 60x40 grid where 1 represents a collideable tile and 0 represents a walkable tile

Success Response:
\`\`\`json
{
  "success": true,
  "position": {
    "x": number,          // Bot's current x position
    "y": number,          // Bot's current y position
    "direction": string   // Bot's current facing direction
  },
  "map": number[][],      // 60x40 collision map (0 = walkable, 1 = collideable)
  "collideableTiles": [   // List of nearby collideable tile positions
    { 
      "x": number, 
      "y": number 
    }
  ],
  "players": [            // List of nearby players
    {
      "id": string,
      "x": number,
      "y": number,
      "direction": "up" | "down" | "left" | "right"
    }
  ]
}
\`\`\`

Failure Response:
\`\`\`json
{
  "success": false,
  "error": string    // Error message explaining what went wrong
}
\`\`\`

Common Error Cases:
- 401 Unauthorized: Invalid or missing authentication token
- 400 Bad Request: Missing bot ID or attempting to view as a non-bot player
- 500 Internal Server Error: Server-side error while getting bot view

Examples:

cURL:
\`\`\`bash
# Using GET method
curl ${baseUrl}/api/see/my-bot \\
  -H "Authorization: Bearer your-bot-token"

# Using POST method
curl -X POST ${baseUrl}/api/see/my-bot \\
  -H "Authorization: Bearer your-bot-token"
\`\`\`

TypeScript:
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Using GET method
const response = await api.get('/api/see/my-bot');

// Using POST method
const altResponse = await api.post('/api/see/my-bot');
\`\`\`

Python:
\`\`\`python
import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Using GET method
response = requests.get(
    f'{api_url}/api/see/my-bot',
    headers=headers
)

# Using POST method
alt_response = requests.post(
    f'{api_url}/api/see/my-bot',
    headers=headers
)
\`\`\`

### POST /api/move/:id
Move your bot around the game world with sequential moves.

Request Body:
\`\`\`json
{
  "moves": string[]    // Array of directions: "right", "up", "left", "down"
}
\`\`\`

Notes:
- The bot ID must be provided in the URL
- Only bots can use this endpoint - attempting to move a non-bot player will result in an error
- The moves array must contain valid directions: "right", "up", "left", "down"
- Moves are executed sequentially with a 200ms delay between each move
- The bot's "moving" state is automatically managed (set to true during movement, false when complete)
- If any move fails (e.g., collision), the sequence stops and returns the current state
- The moving state is always reset to false on completion or error

Success Response:
\`\`\`json
{
  "success": true,
  "moves": string[],           // Array of all completed moves
  "finalPosition": {
    "x": number,              // Final x position
    "y": number,              // Final y position
    "direction": string       // Final facing direction
  }
}
\`\`\`

Failure Response:
\`\`\`json
{
  "success": false,
  "error": string,            // Error message explaining what went wrong
  "completedMoves": string[], // Moves that were successful before failure
  "failedMove": string,       // The move that caused the failure
  "remainingMoves": string[], // Moves not attempted
  "currentPosition": {        // Position when failure occurred
    "x": number,
    "y": number,
    "direction": string
  }
}
\`\`\`

Common Error Cases:
- 401 Unauthorized: Invalid or missing authentication token
- 400 Bad Request:
  - Missing bot ID
  - Moves is not an array
  - Invalid direction in moves array
  - Attempting to move a non-bot player
- 405 Method Not Allowed: Using a method other than POST
- 500 Internal Server Error: Server-side error during movement

Examples:

cURL:
\`\`\`bash
# Simple movement sequence
curl -X POST ${baseUrl}/api/move/my-bot \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "moves": ["right", "up"]
  }'

# Complex movement sequence
curl -X POST ${baseUrl}/api/move/my-bot \\
  -H "Authorization: Bearer your-bot-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "moves": ["right", "up", "right", "down", "right"]
  }'
\`\`\`

TypeScript:
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-bot-token'
  }
});

// Simple movement sequence
const simpleResponse = await api.post('/api/move/my-bot', {
  moves: ['right', 'up']
});

// Complex movement sequence
const complexResponse = await api.post('/api/move/my-bot', {
  moves: ['right', 'up', 'right', 'down', 'right']
});

// Handle potential movement failure
try {
  const response = await api.post('/api/move/my-bot', {
    moves: ['right', 'up', 'right']
  });
  
  if (!response.data.success) {
    console.log('Movement failed at:', response.data.failedMove);
    console.log('Completed moves:', response.data.completedMoves);
    console.log('Current position:', response.data.currentPosition);
  }
} catch (error) {
  console.error('Movement error:', error);
}
\`\`\`

Python:
\`\`\`python
import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-bot-token'
}

# Simple movement sequence
simple_response = requests.post(
    f'{api_url}/api/move/my-bot',
    headers=headers,
    json={
        'moves': ['right', 'up']
    }
)

# Complex movement sequence
complex_response = requests.post(
    f'{api_url}/api/move/my-bot',
    headers=headers,
    json={
        'moves': ['right', 'up', 'right', 'down', 'right']
    }
)

# Handle potential movement failure
try:
    response = requests.post(
        f'{api_url}/api/move/my-bot',
        headers=headers,
        json={
            'moves': ['right', 'up', 'right']
        }
    )
    data = response.json()
    
    if not data['success']:
        print('Movement failed at:', data['failedMove'])
        print('Completed moves:', data['completedMoves'])
        print('Current position:', data['currentPosition'])
except Exception as error:
    print('Movement error:', error)
\`\`\`

### POST /api/send/:id
Send messages to nearby players, rooms, or globally with intelligent delivery routing.

Authentication:
- Requires an admin token in the Authorization header
- Format: \`Authorization: Bearer your-admin-token\`

Request Body:
\`\`\`json
{
  "text": string,           // Required: Message content
  "targetUserId": string    // Optional: Specific user to message
}
\`\`\`

Message Delivery System:
Messages are delivered based on a priority system:

1. Direct Message (Priority 1):
   - If targetUserId is provided and valid, sends a direct message
   - Validates that the target user exists

2. Room Message (Priority 2):
   - If bot is in a room, sends message to all room members
   - Only applies if no targetUserId is specified

3. Proximity Direct Message (Priority 3):
   - If no room and no targetUserId, checks for nearby players
   - Sends DM to closest player within 1.5 tile radius
   - Uses Euclidean distance for proximity calculation

4. Global Message (Priority 4):
   - If no other conditions apply, sends to all players
   - Fallback when no specific recipients are found

Success Response:
\`\`\`json
{
  "success": true,
  "message": {
    "text": string,         // The message content
    "sender": string,       // Bot's display name
    "senderId": string,     // Bot's unique ID
    "type": string,         // Message type: "dm", "room", or "global"
    "targetId": string,     // Only present for DMs - recipient's ID
    "room": string         // Only present for room messages - room name
  }
}
\`\`\`

Failure Response:
\`\`\`json
{
  "success": false,
  "error": string          // Error message explaining what went wrong
}
\`\`\`

Common Error Cases:
- 401 Unauthorized:
  - Missing Authorization header
  - Invalid admin token
- 400 Bad Request:
  - Missing bot ID in URL
  - Missing or invalid message text
  - Attempting to send from a non-bot ID
- 404 Not Found:
  - Bot not found
  - Target user not found (when targetUserId is provided)
- 405 Method Not Allowed: Using a method other than POST
- 500 Internal Server Error: Server-side error during message sending

Examples:

cURL:
\`\`\`bash
# Send a direct message to specific user
curl -X POST ${baseUrl}/api/send/my-bot \\
  -H "Authorization: Bearer your-admin-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello there!",
    "targetUserId": "user123"
  }'

# Send a message (auto-routed based on context)
curl -X POST ${baseUrl}/api/send/my-bot \\
  -H "Authorization: Bearer your-admin-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello everyone!"
  }'
\`\`\`

TypeScript:
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    Authorization: 'Bearer your-admin-token'
  }
});

// Send a direct message to specific user
const dmResponse = await api.post('/api/send/my-bot', {
  text: 'Hello there!',
  targetUserId: 'user123'
});

// Send a message (auto-routed based on context)
const response = await api.post('/api/send/my-bot', {
  text: 'Hello everyone!'
});

// Handle potential errors
try {
  const response = await api.post('/api/send/my-bot', {
    text: 'Hello!',
    targetUserId: 'user123'
  });
  
  if (response.data.success) {
    console.log('Message sent:', response.data.message);
    console.log('Delivery type:', response.data.message.type);
  }
} catch (error) {
  if (error.response?.status === 404) {
    console.error('User or bot not found');
  } else if (error.response?.status === 401) {
    console.error('Invalid admin token');
  } else {
    console.error('Error sending message:', error);
  }
}
\`\`\`

Python:
\`\`\`python
import requests

api_url = '${baseUrl}'
headers = {
    'Authorization': 'Bearer your-admin-token'
}

# Send a direct message to specific user
dm_response = requests.post(
    f'{api_url}/api/send/my-bot',
    headers=headers,
    json={
        'text': 'Hello there!',
        'targetUserId': 'user123'
    }
)

# Send a message (auto-routed based on context)
response = requests.post(
    f'{api_url}/api/send/my-bot',
    headers=headers,
    json={
        'text': 'Hello everyone!'
    }
)

# Handle potential errors
try:
    response = requests.post(
        f'{api_url}/api/send/my-bot',
        headers=headers,
        json={
            'text': 'Hello!',
            'targetUserId': 'user123'
        }
    )
    data = response.json()
    
    if data['success']:
        print('Message sent:', data['message'])
        print('Delivery type:', data['message']['type'])
except requests.exceptions.RequestException as error:
    if error.response is not None:
        if error.response.status_code == 404:
            print('User or bot not found')
        elif error.response.status_code == 401:
            print('Invalid admin token')
        else:
            print('Error sending message:', error)
    else:
        print('Network error:', error)
\`\`\`

## Rate Limits
API requests are rate-limited for fair usage:
- Movement: 10 requests per second
- Messaging: 5 messages per second
- See: 2 requests per second
- Other endpoints: 1 request per second

## Error Handling
The API uses standard HTTP status codes and returns error responses in the following format:

\`\`\`json
{
  "error": {
    "code": string,
    "message": string,
    "details": object (optional)
  }
}
\`\`\``;

  return new Response(docs, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

