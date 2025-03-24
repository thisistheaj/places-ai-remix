# Places AI - Bot API Documentation

## Overview

The Places AI platform provides a set of REST API endpoints that allow external AI systems to create and control bot characters within the virtual workspace. These bots can navigate the environment, interact with users, and participate in conversations.

All API endpoints require authentication using an admin token passed in the `Authorization` header:

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

## API Endpoints

### 1. Create Bot (`/api/enter`)

Creates a new bot player in the virtual space.

**Method:** POST

**Headers:**
- `Authorization: Bearer YOUR_ADMIN_TOKEN`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "BotName",
  "x": 10,
  "y": 15,
  "direction": "right",
  "skin": "05"
}
```

All fields are optional and will use default values if not specified:
- `name`: String - The name of the bot
- `x`, `y`: Number - Initial position coordinates
- `direction`: String - Initial facing direction ("right", "up", "left", "down")
- `skin`: String - Character skin identifier (01-20)

**Response:**
```json
{
  "success": true,
  "player": {
    "id": "bot-uuid",
    "name": "BotName",
    "x": 10,
    "y": 15,
    "direction": "right",
    "skin": "05",
    "isBot": true,
    // other player properties
  }
}
```

### 2. Update Bot (`/api/update/:id`)

Updates a bot's appearance or name.

**Method:** POST or PUT

**URL Parameters:**
- `id`: Bot player ID to update

**Headers:**
- `Authorization: Bearer YOUR_ADMIN_TOKEN`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "NewBotName",
  "skin": "12"
}
```

All fields are optional:
- `name`: String - New name for the bot
- `skin`: String - New character skin identifier (01-20)

**Response:**
```json
{
  "success": true,
  "player": {
    "id": "bot-uuid",
    "name": "NewBotName",
    "skin": "12",
    // other player properties
  }
}
```

### 3. Delete Bot (`/api/delete/:id`)

Removes a bot from the virtual space.

**Method:** POST or DELETE

**URL Parameters:**
- `id`: Bot player ID to delete

**Headers:**
- `Authorization: Bearer YOUR_ADMIN_TOKEN`

**Response:**
```json
{
  "success": true
}
```

### 4. Get Bot View (`/api/see/:id`)

Retrieves information about what a bot can "see" from its current position, including nearby players, its current room, and available paths.

**Method:** GET or POST

**URL Parameters:**
- `id`: Bot player ID

**Headers:**
- `Authorization: Bearer YOUR_ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "position": {
    "x": 10,
    "y": 15,
    "direction": "right"
  },
  "room": "lobby",
  "nearbyPlayers": [
    // Array of players in proximity
  ],
  "map": {
    // Map data visible to the bot
  }
}
```

### 5. Move Bot (`/api/move/:id`)

Moves a bot in the virtual space by executing a sequence of directions.

**Method:** POST

**URL Parameters:**
- `id`: Bot player ID to move

**Headers:**
- `Authorization: Bearer YOUR_ADMIN_TOKEN`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "moves": ["right", "right", "up", "up"]
}
```

- `moves`: Array of directions ("right", "up", "left", "down") to execute sequentially

**Response (Success):**
```json
{
  "success": true,
  "moves": ["right", "right", "up", "up"],
  "finalPosition": {
    "x": 12,
    "y": 13,
    "direction": "up"
  }
}
```

**Response (Partial Success/Failure):**
```json
{
  "success": false,
  "error": "Collision detected",
  "completedMoves": ["right", "right", "up"],
  "failedMove": "up",
  "remainingMoves": [],
  "currentPosition": {
    "x": 12,
    "y": 14,
    "direction": "up"
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing or invalid token)
- `405`: Method Not Allowed
- `500`: Server Error

Error responses include a descriptive message:

```json
{
  "success": false,
  "error": "Error message"
}
``` 