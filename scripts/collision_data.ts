/**
 * Generated Collision Data
 * Generated on: 2025-03-22T04:46:12.207Z
 * 
 * This file contains the collision data extracted from the game's tilemap.
 * It can be imported directly or used as a reference to update the collision data
 * in app/lib/user.ts.
 */

// Define map dimensions
export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 40;
export const TILE_SIZE = 32; // Size of one grid square in pixels

// This structure represents the tiles that have collisions
// organized by layer name from the game
export const COLLISION_DATA = {
  // Base/Walls
  'Base/Walls': [
    ...Array(60).fill(0).map((_, i) => ({ x: 0 + i, y: 0 })),
    ...Array(60).fill(0).map((_, i) => ({ x: 0 + i, y: 1 })),
    { x: 0, y: 2 },
    { x: 59, y: 2 },
    { x: 0, y: 3 },
    { x: 59, y: 3 },
    { x: 0, y: 4 },
    { x: 59, y: 4 },
    { x: 0, y: 5 },
    { x: 59, y: 5 },
    { x: 0, y: 6 },
    { x: 59, y: 6 },
    { x: 0, y: 7 },
    { x: 59, y: 7 },
    { x: 0, y: 8 },
    { x: 59, y: 8 },
    { x: 0, y: 9 },
    { x: 59, y: 9 },
    { x: 0, y: 10 },
    { x: 59, y: 10 },
    { x: 0, y: 11 },
    { x: 59, y: 11 },
    { x: 0, y: 12 },
    { x: 59, y: 12 },
    { x: 0, y: 13 },
    { x: 4, y: 13 },
    { x: 59, y: 13 },
    { x: 0, y: 14 },
    { x: 4, y: 14 },
    { x: 59, y: 14 },
    { x: 0, y: 15 },
    { x: 4, y: 15 },
    { x: 59, y: 15 },
    { x: 0, y: 16 },
    { x: 59, y: 16 },
    { x: 0, y: 17 },
    { x: 59, y: 17 },
    { x: 0, y: 18 },
    { x: 59, y: 18 },
    { x: 0, y: 19 },
    { x: 59, y: 19 },
    { x: 0, y: 20 },
    { x: 59, y: 20 },
    { x: 0, y: 21 },
    { x: 59, y: 21 },
    { x: 0, y: 22 },
    { x: 59, y: 22 },
    { x: 0, y: 23 },
    { x: 59, y: 23 },
    { x: 0, y: 24 },
    { x: 59, y: 24 },
    { x: 0, y: 25 },
    { x: 59, y: 25 },
    { x: 0, y: 26 },
    { x: 59, y: 26 },
    { x: 0, y: 27 },
    { x: 59, y: 27 },
    { x: 0, y: 28 },
    { x: 59, y: 28 },
    { x: 0, y: 29 },
    { x: 59, y: 29 },
    { x: 0, y: 30 },
    { x: 59, y: 30 },
    { x: 0, y: 31 },
    { x: 59, y: 31 },
    { x: 0, y: 32 },
    { x: 59, y: 32 },
    { x: 0, y: 33 },
    { x: 59, y: 33 },
    { x: 0, y: 34 },
    { x: 59, y: 34 },
    { x: 0, y: 35 },
    { x: 59, y: 35 },
    { x: 0, y: 36 },
    { x: 59, y: 36 },
    { x: 0, y: 37 },
    { x: 59, y: 37 },
    { x: 0, y: 38 },
    { x: 59, y: 38 },
    ...Array(60).fill(0).map((_, i) => ({ x: 0 + i, y: 39 })),
  ],

  // Desks/Bottom
  'Desks/Bottom': [
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 11 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 11 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 11 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 12 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 12 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 12 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 12 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 12 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 12 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 13 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 13 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 13 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 15 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 15 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 15 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 16 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 16 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 16 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 16 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 16 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 16 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 17 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 17 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 17 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 19 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 19 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 19 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 20 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 20 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 20 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 20 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 20 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 20 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 21 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 21 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 21 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 23 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 23 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 23 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 24 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 24 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 24 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 24 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 24 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 24 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 25 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 25 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 25 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 27 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 27 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 27 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 4 + i, y: 28 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 28 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 14 + i, y: 28 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 28 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 49 + i, y: 28 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 28 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 9 + i, y: 29 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 44 + i, y: 29 })),
    ...Array(2).fill(0).map((_, i) => ({ x: 54 + i, y: 29 })),
  ],

  // Conference/Walls
  'Conference/Walls': [
    ...Array(22).fill(0).map((_, i) => ({ x: 19 + i, y: 10 })),
    { x: 19, y: 11 },
    { x: 30, y: 11 },
    { x: 40, y: 11 },
    { x: 19, y: 12 },
    { x: 30, y: 12 },
    { x: 40, y: 12 },
    { x: 30, y: 13 },
    { x: 30, y: 14 },
    { x: 30, y: 15 },
    { x: 19, y: 16 },
    { x: 30, y: 16 },
    { x: 40, y: 16 },
    { x: 19, y: 17 },
    { x: 30, y: 17 },
    { x: 40, y: 17 },
    { x: 19, y: 18 },
    { x: 30, y: 18 },
    { x: 40, y: 18 },
    { x: 19, y: 19 },
    { x: 30, y: 19 },
    { x: 40, y: 19 },
    ...Array(22).fill(0).map((_, i) => ({ x: 19 + i, y: 20 })),
    { x: 19, y: 21 },
    { x: 30, y: 21 },
    { x: 40, y: 21 },
    { x: 19, y: 22 },
    { x: 30, y: 22 },
    { x: 40, y: 22 },
    { x: 19, y: 23 },
    { x: 30, y: 23 },
    { x: 40, y: 23 },
    { x: 30, y: 24 },
    { x: 30, y: 25 },
    { x: 30, y: 26 },
    { x: 19, y: 27 },
    { x: 30, y: 27 },
    { x: 40, y: 27 },
    { x: 19, y: 28 },
    { x: 30, y: 28 },
    { x: 40, y: 28 },
    { x: 19, y: 29 },
    { x: 30, y: 29 },
    { x: 40, y: 29 },
    ...Array(22).fill(0).map((_, i) => ({ x: 19 + i, y: 30 })),
  ],

  // Conference/Tables Middle
  'Conference/Tables Middle': [
    ...Array(4).fill(0).map((_, i) => ({ x: 23 + i, y: 14 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 33 + i, y: 14 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 23 + i, y: 24 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 33 + i, y: 24 })),
  ],

  // Conference/Tables Bottom
  'Conference/Tables Bottom': [
    ...Array(4).fill(0).map((_, i) => ({ x: 23 + i, y: 15 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 33 + i, y: 15 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 23 + i, y: 24 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 33 + i, y: 24 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 23 + i, y: 25 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 33 + i, y: 25 })),
  ],

  // Games/Tables Middle
  'Games/Tables Middle': [
    ...Array(3).fill(0).map((_, i) => ({ x: 12 + i, y: 32 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 52 + i, y: 32 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 4 + i, y: 33 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 12 + i, y: 33 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 44 + i, y: 33 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 52 + i, y: 33 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 4 + i, y: 34 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 12 + i, y: 34 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 44 + i, y: 34 })),
    ...Array(3).fill(0).map((_, i) => ({ x: 52 + i, y: 34 })),
  ],

  // Lounge/Tables
  'Lounge/Tables': [
    ...Array(4).fill(0).map((_, i) => ({ x: 28 + i, y: 1 })),
    ...Array(8).fill(0).map((_, i) => ({ x: 26 + i, y: 5 })),
    { x: 26, y: 6 },
    { x: 33, y: 6 },
    ...Array(4).fill(0).map((_, i) => ({ x: 28 + i, y: 32 })),
    ...Array(4).fill(0).map((_, i) => ({ x: 28 + i, y: 33 })),
  ],

  // Lounge/Couches Center Backs
  'Lounge/Couches Center Backs': [
    { x: 25, y: 32 },
    { x: 34, y: 32 },
    { x: 25, y: 33 },
    { x: 34, y: 33 },
  ],

};

// Create a collision map array 
// (0 = walkable, 1 = collision)
export function createCollisionMap(): number[][] {
  const collisionMap = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(0));
  
  // Apply all collision data to the collision map
  for (const [layerName, positions] of Object.entries(COLLISION_DATA)) {
    for (const pos of positions) {
      if (pos.y >= 0 && pos.y < MAP_HEIGHT && pos.x >= 0 && pos.x < MAP_WIDTH) {
        collisionMap[pos.y][pos.x] = 1;
      }
    }
  }
  
  return collisionMap;
}

// Generate the collision map
export const COLLISION_MAP = createCollisionMap();

// Helper function to check if a position is blocked
export function isPositionBlocked(x: number, y: number): boolean {
  // Out of bounds check
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
    return true;
  }
  
  // Check the collision map
  return COLLISION_MAP[y][x] === 1;
}
