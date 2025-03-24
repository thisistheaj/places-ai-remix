#!/usr/bin/env ts-node

/**
 * Extract Collision Map Script
 * 
 * This script reads the game's tilemap data and extracts the collision information
 * to generate a collision map that can be used in the server-side code.
 * 
 * Usage:
 *   npm run extract-collision
 *   (or directly with: ts-node scripts/extract_collision_map.ts)
 */

import * as fs from 'fs';
import * as path from 'path';

// Map dimensions
const MAP_WIDTH = 60;
const MAP_HEIGHT = 40;

// Names of collision layers from the game
const COLLISION_LAYERS = [
  'Base/Walls',
  'Desks/Bottom',
  'Conference/Walls',
  'Conference/Tables Middle',
  'Conference/Tables Bottom',
  'Games/Tables Middle',
  'Lounge/Tables',
  'Lounge/Couches Center Backs',
];

async function main() {
  console.log('🗺️  Extracting collision map from tilemap data...');
  
  try {
    // Read the tilemap JSON file
    const tilemapPath = path.join(process.cwd(), 'public', 'assets', 'tilemaps', 'office_1.json');
    if (!fs.existsSync(tilemapPath)) {
      console.error(`❌ Tilemap file not found at ${tilemapPath}`);
      process.exit(1);
    }
    
    const tilemapData = JSON.parse(fs.readFileSync(tilemapPath, 'utf8'));
    
    // Extract all layers from the tilemap
    const allLayers = extractLayers(tilemapData);
    
    // Create a collision data structure
    const collisionData: { [layerName: string]: Array<{x: number, y: number}> } = {};
    
    // Initialize each collision layer with an empty array
    for (const layerName of COLLISION_LAYERS) {
      collisionData[layerName] = [];
    }
    
    // Populate collision data for each layer
    for (const layerName of COLLISION_LAYERS) {
      const layer = allLayers.find(l => l.name === layerName);
      if (layer) {
        console.log(`✓ Processing collision layer: ${layerName}`);
        
        // Get collision tiles from this layer
        const collisionTiles = extractCollisionTiles(layer, MAP_WIDTH, MAP_HEIGHT);
        collisionData[layerName] = collisionTiles;
      } else {
        console.warn(`⚠️ Collision layer not found: ${layerName}`);
      }
    }
    
    // Generate the collision map 
    const collisionMap = createCollisionMap(collisionData);
    
    // Print the collision map to terminal as a series of 0s and 1s
    printCollisionMap(collisionMap);
    
    // Generate TypeScript code for the collision data and write to file
    const tsCode = generateTypeScriptCode(collisionData);
    const outputPath = path.join(process.cwd(), 'scripts', 'collision_data.ts');
    fs.writeFileSync(outputPath, tsCode);
    
    console.log(`✅ Collision data extracted and saved to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error extracting collision data:', error);
    process.exit(1);
  }
}

/**
 * Extract all layers from the tilemap data
 */
function extractLayers(tilemapData: any): Array<any> {
  const layers: Array<any> = [];
  
  // Check if we have grouped layers or flat layers
  if (tilemapData.layers && tilemapData.layers.length > 0) {
    for (const layerOrGroup of tilemapData.layers) {
      // Check if this is a group layer
      if (layerOrGroup.type === 'group' && layerOrGroup.layers) {
        // For group layers, extract the full path for each sublayer
        for (const sublayer of layerOrGroup.layers) {
          if (sublayer.type === 'tilelayer') {
            // Create a copy with the full path name
            const layerWithFullPath = { ...sublayer };
            layerWithFullPath.name = `${layerOrGroup.name}/${sublayer.name}`;
            layers.push(layerWithFullPath);
          }
        }
      } else if (layerOrGroup.type === 'tilelayer') {
        // For regular tile layers, add them directly
        layers.push(layerOrGroup);
      }
    }
  }
  
  return layers;
}

/**
 * Extract collision tiles from a layer
 */
function extractCollisionTiles(layer: any, width: number, height: number): Array<{x: number, y: number}> {
  const collisionTiles: Array<{x: number, y: number}> = [];
  
  // Check if we have the data array
  if (layer.data && Array.isArray(layer.data)) {
    // Iterate through each tile
    for (let i = 0; i < layer.data.length; i++) {
      const tileId = layer.data[i];
      
      // If tile ID is not 0, it's a tile (0 is empty)
      if (tileId !== 0) {
        // Calculate x,y coordinates from the index
        const x = i % width;
        const y = Math.floor(i / width);
        
        collisionTiles.push({ x, y });
      }
    }
  }
  
  return collisionTiles;
}

/**
 * Create a collision map array from the collision data
 * (0 = walkable, 1 = collision)
 */
function createCollisionMap(collisionData: { [layerName: string]: Array<{x: number, y: number}> }): number[][] {
  const collisionMap = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(0));
  
  // Apply all collision data to the collision map
  for (const [layerName, positions] of Object.entries(collisionData)) {
    for (const pos of positions) {
      if (pos.y >= 0 && pos.y < MAP_HEIGHT && pos.x >= 0 && pos.x < MAP_WIDTH) {
        collisionMap[pos.y][pos.x] = 1;
      }
    }
  }
  
  return collisionMap;
}

/**
 * Print the collision map to terminal as a grid of 0s and 1s
 */
function printCollisionMap(collisionMap: number[][]) {
  console.log('\n🗺️  Collision Map (60x40):\n');
  
  for (let y = 0; y < MAP_HEIGHT; y++) {
    let row = '';
    for (let x = 0; x < MAP_WIDTH; x++) {
      row += collisionMap[y][x];
    }
    console.log(row);
  }
  
  console.log('\n'); // Add some spacing after the map
}

/**
 * Generate TypeScript code for the collision data
 */
function generateTypeScriptCode(collisionData: { [layerName: string]: Array<{x: number, y: number}> }): string {
  let code = `/**
 * Generated Collision Data
 * Generated on: ${new Date().toISOString()}
 * 
 * This file contains the collision data extracted from the game's tilemap.
 * It can be imported directly or used as a reference to update the collision data
 * in app/lib/user.ts.
 */

// Define map dimensions
export const MAP_WIDTH = ${MAP_WIDTH};
export const MAP_HEIGHT = ${MAP_HEIGHT};
export const TILE_SIZE = 32; // Size of one grid square in pixels

// This structure represents the tiles that have collisions
// organized by layer name from the game
export const COLLISION_DATA = {
`;

  // Add each layer's collision data
  for (const [layerName, tiles] of Object.entries(collisionData)) {
    code += `  // ${layerName}\n`;
    code += `  '${layerName}': [\n`;
    
    // Group tiles by y-coordinate for more compact representation
    const tilesByY: { [y: number]: number[] } = {};
    for (const tile of tiles) {
      if (!tilesByY[tile.y]) {
        tilesByY[tile.y] = [];
      }
      tilesByY[tile.y].push(tile.x);
    }
    
    // Find ranges of consecutive x-coordinates to compress the data
    for (const [y, xValues] of Object.entries(tilesByY)) {
      const ranges = compressRanges(xValues.sort((a, b) => a - b));
      
      // Output in a readable format
      if (ranges.length === 1 && ranges[0].start === ranges[0].end) {
        // Single coordinates
        code += `    { x: ${ranges[0].start}, y: ${y} },\n`;
      } else {
        // Output ranges using array spread to generate consecutive values
        for (const range of ranges) {
          if (range.start === range.end) {
            code += `    { x: ${range.start}, y: ${y} },\n`;
          } else {
            code += `    ...Array(${range.end - range.start + 1}).fill(0).map((_, i) => ({ x: ${range.start} + i, y: ${y} })),\n`;
          }
        }
      }
    }
    
    code += `  ],\n\n`;
  }
  
  code += `};

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
`;

  return code;
}

/**
 * Compress consecutive numbers into ranges
 */
function compressRanges(values: number[]): Array<{start: number, end: number}> {
  if (values.length === 0) return [];
  
  const ranges: Array<{start: number, end: number}> = [];
  let rangeStart = values[0];
  let rangeEnd = values[0];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] === rangeEnd + 1) {
      // Extend the current range
      rangeEnd = values[i];
    } else {
      // End the current range and start a new one
      ranges.push({ start: rangeStart, end: rangeEnd });
      rangeStart = values[i];
      rangeEnd = values[i];
    }
  }
  
  // Add the last range
  ranges.push({ start: rangeStart, end: rangeEnd });
  
  return ranges;
}

// Run the script
main().catch(console.error); 