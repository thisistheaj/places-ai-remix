import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

interface TiledLayerData extends Phaser.Tilemaps.LayerData {
    type?: string;
    layers?: TiledLayerData[];
}

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    map: Phaser.Tilemaps.Tilemap;
    layers: {[key: string]: Phaser.Tilemaps.TilemapLayer} = {};
    debugText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        console.log('Creating Game scene');
        
        // Set up camera
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x222222);

        // Create the tilemap
        this.map = this.make.tilemap({ key: 'office' });
        
        console.log('Loaded map:', this.map.width, 'x', this.map.height);
        console.log('Tilesets in map:', this.map.tilesets.map(t => t.name));
        
        // Add all the tilesets - matching by index since the tileset paths in JSON might not match
        // This approach ignores the tileset paths in the JSON and directly maps to our loaded image keys
        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        
        // Try different possible tileset names - the JSON may have different names than our loaded images
        // First try with the exact name from the tileset
        let genericTileset = this.map.addTilesetImage('1_Generic_Shadowless32x32', 'generic');
        // If that fails, try with different variations
        if (!genericTileset) genericTileset = this.map.addTilesetImage('1_Generic_32x32', 'generic');
        if (!genericTileset) genericTileset = this.map.addTilesetImage('1_Generic', 'generic');
        if (genericTileset) tilesets.push(genericTileset);
        
        let livingroomTileset = this.map.addTilesetImage('2_LivingRoom_Shadowless_32x32', 'livingroom');
        if (!livingroomTileset) livingroomTileset = this.map.addTilesetImage('2_LivingRoom_32x32', 'livingroom');
        if (!livingroomTileset) livingroomTileset = this.map.addTilesetImage('2_LivingRoom', 'livingroom');
        if (livingroomTileset) tilesets.push(livingroomTileset);
        
        let officeTileset = this.map.addTilesetImage('Modern_Office_Shadowless_32x32', 'office-tiles');
        if (!officeTileset) officeTileset = this.map.addTilesetImage('Modern_Office_32x32', 'office-tiles');
        if (!officeTileset) officeTileset = this.map.addTilesetImage('Modern_Office', 'office-tiles');
        if (officeTileset) tilesets.push(officeTileset);
        
        let kitchenTileset = this.map.addTilesetImage('12_Kitchen_Shadowless_32x32', 'kitchen');
        if (!kitchenTileset) kitchenTileset = this.map.addTilesetImage('12_Kitchen_32x32', 'kitchen');
        if (!kitchenTileset) kitchenTileset = this.map.addTilesetImage('12_Kitchen', 'kitchen');
        if (kitchenTileset) tilesets.push(kitchenTileset);
        
        let basementTileset = this.map.addTilesetImage('14_Basement_Shadowless_32x32', 'basement');
        if (!basementTileset) basementTileset = this.map.addTilesetImage('14_Basement_32x32', 'basement');
        if (!basementTileset) basementTileset = this.map.addTilesetImage('14_Basement', 'basement');
        if (basementTileset) tilesets.push(basementTileset);
        
        // If we failed to load any tilesets, try one more approach - use the first tileset's firstgid
        if (tilesets.length === 0 && this.map.tilesets.length > 0) {
            console.warn('Failed to load tilesets by name. Trying to load by index...');
            
            // Try to load each tileset by index
            const imageKeys = ['generic', 'livingroom', 'office-tiles', 'kitchen', 'basement'];
            for (let i = 0; i < Math.min(this.map.tilesets.length, imageKeys.length); i++) {
                const tileset = this.map.addTilesetImage(this.map.tilesets[i].name, imageKeys[i]);
                if (tileset) {
                    tilesets.push(tileset);
                    console.log(`Added tileset ${this.map.tilesets[i].name} as ${imageKeys[i]}`);
                }
            }
        }
        
        // If we still failed to load any tilesets, log an error
        if (tilesets.length === 0) {
            console.error('Failed to load any tilesets for the tilemap!');
            console.log('Available tilesets in map:', this.map.tilesets.map(t => t.name).join(', '));
            return;
        } else {
            console.log(`Successfully loaded ${tilesets.length} tilesets`);
        }
        
        // Try to create layers - we need to handle potentially nested layer groups
        // We'll need to type cast the layers to access custom properties from Tiled
        const mapLayers = this.map.layers as TiledLayerData[];
        
        console.log('Map layers:', mapLayers.map(l => l.name).join(', '));
        
        try {
            // Check if the map has nested layer groups
            if (mapLayers.length > 0 && mapLayers[0].type === 'group') {
                console.log('Map has grouped layers');
                // Handle group layers
                mapLayers.forEach(groupLayer => {
                    if (groupLayer.type === 'group' && groupLayer.layers) {
                        groupLayer.layers.forEach(layer => {
                            if (layer.type === 'tilelayer') {
                                try {
                                    const createdLayer = this.map.createLayer(layer.name, tilesets, 0, 0);
                                    if (createdLayer) {
                                        this.layers[layer.name] = createdLayer;
                                        console.log(`Created layer: ${layer.name}`);
                                    }
                                } catch (e) {
                                    console.error(`Error creating layer ${layer.name}:`, e);
                                }
                            }
                        });
                    }
                });
            } else {
                console.log('Map has flat layer structure');
                // Handle flat layer structure
                mapLayers.forEach(layer => {
                    try {
                        const createdLayer = this.map.createLayer(layer.name, tilesets, 0, 0);
                        if (createdLayer) {
                            this.layers[layer.name] = createdLayer;
                            console.log(`Created layer: ${layer.name}`);
                        }
                    } catch (e) {
                        console.error(`Error creating layer ${layer.name}:`, e);
                    }
                });
            }
        } catch (e) {
            console.error('Error creating layers:', e);
        }
        
        // If we failed to create any layers, log an error
        if (Object.keys(this.layers).length === 0) {
            console.error('Failed to create any layers for the tilemap!');
            console.log('Available layers in map:', this.map.layers.map(l => l.name).join(', '));
            
            // As a last resort, try to create a single layer with index 0
            try {
                const layer = this.map.createLayer(0, tilesets, 0, 0);
                if (layer) {
                    this.layers['layer0'] = layer;
                    console.log('Created layer with index 0');
                }
            } catch (e) {
                console.error('Even creating layer with index 0 failed:', e);
            }
        } else {
            console.log(`Successfully created ${Object.keys(this.layers).length} layers`);
        }
        
        // Set up camera bounds based on the map size
        this.camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
        // Adjust the zoom level if needed
        // this.camera.setZoom(0.75); // Zoom out a bit to see more of the map

        // Add debug text overlay
        this.createDebugOverlay();

        // Signal that the scene is ready
        EventBus.emit('current-scene-ready', this);
    }

    createDebugOverlay() {
        // Create debug text to show what was loaded
        const debugInfo = [
            `Map: ${this.map.width}x${this.map.height} tiles (${this.map.widthInPixels}x${this.map.heightInPixels}px)`,
            `Tilesets loaded: ${this.map.tilesets.length}`,
            `Layers created: ${Object.keys(this.layers).length}`
        ];

        // Add layer names
        if (Object.keys(this.layers).length > 0) {
            debugInfo.push('Layers:');
            Object.keys(this.layers).forEach(layerName => {
                debugInfo.push(`- ${layerName}`);
            });
        }

        // Create debug text object
        this.debugText = this.add.text(10, 10, debugInfo, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setScrollFactor(0); // Fixed to camera
        this.debugText.setDepth(1000); // Make sure it's on top
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
