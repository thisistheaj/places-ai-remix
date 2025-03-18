import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const jsonPath = path.join(__dirname, '../public/assets/tilemaps/office_1.json');

// First read the raw file to check if any changes are needed
const rawContent = fs.readFileSync(jsonPath, 'utf8');
const jsonContent = JSON.parse(rawContent);

let needsSave = false;

// Process each tileset
if (jsonContent.tilesets) {
    jsonContent.tilesets = jsonContent.tilesets.map((tileset: any) => {
        let modified = false;
        
        // Handle image paths
        if (tileset.image) {
            const downloadsIndex = tileset.image.indexOf('Downloads');
            if (downloadsIndex !== -1) {
                tileset.image = tileset.image.substring(downloadsIndex);
                modified = true;
            }
            
            const withForwardSlashes = tileset.image.replace(/\\/g, '/');
            if (withForwardSlashes !== tileset.image) {
                tileset.image = withForwardSlashes;
                modified = true;
            }
        }
        
        // Trim tileset names
        if (tileset.name && tileset.name.trim() !== tileset.name) {
            tileset.name = tileset.name.trim();
            modified = true;
        }
        
        if (modified) {
            needsSave = true;
        }
        
        return tileset;
    });
}

// Only save if we actually made changes
if (needsSave) {
    fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
    console.log('Successfully updated tileset paths and names in office_1.json');
} else {
    console.log('No changes needed in office_1.json');
} 