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
        
        // Add the tilesets
        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        
        // Load each tileset with its exact name from the filesystem
        const genericTileset = this.map.addTilesetImage('1_Generic_Shadowless32x32', 'generic');
        if (!genericTileset) throw new Error('Failed to load generic tileset');
        
        const livingroomTileset = this.map.addTilesetImage('2_LivingRoom_Shadowless_32x32', 'livingroom');
        if (!livingroomTileset) throw new Error('Failed to load livingroom tileset');
        
        const kitchenTileset = this.map.addTilesetImage('12_Kitchen_Shadowless_32x32', 'kitchen');
        if (!kitchenTileset) throw new Error('Failed to load kitchen tileset');
        
        const basementTileset = this.map.addTilesetImage('14_Basement_Shadowless_32x32', 'basement');
        if (!basementTileset) throw new Error('Failed to load basement tileset');
        
        const officeTileset = this.map.addTilesetImage('Modern_Office_Shadowless_32x32', 'office-tiles');
        if (!officeTileset) throw new Error('Failed to load office tileset');
        
        tilesets.push(
            genericTileset,
            livingroomTileset,
            kitchenTileset,
            basementTileset,
            officeTileset
        );
        
        console.log(`Loaded ${tilesets.length} tilesets`);
        
        // Create layers
        const mapLayers = this.map.layers as TiledLayerData[];
        console.log('Map layers:', mapLayers.map(l => l.name).join(', '));
        
        // Handle layer creation based on structure
        if (mapLayers.length > 0 && mapLayers[0].type === 'group') {
            // Handle grouped layers
            mapLayers.forEach(groupLayer => {
                if (groupLayer.type === 'group' && groupLayer.layers) {
                    groupLayer.layers.forEach(layer => {
                        if (layer.type === 'tilelayer') {
                            const createdLayer = this.map.createLayer(layer.name, tilesets, 0, 0);
                            if (!createdLayer) throw new Error(`Failed to create layer: ${layer.name}`);
                            this.layers[layer.name] = createdLayer;
                            console.log(`Created layer: ${layer.name}`);
                        }
                    });
                }
            });
        } else {
            // Handle flat layer structure
            mapLayers.forEach(layer => {
                const createdLayer = this.map.createLayer(layer.name, tilesets, 0, 0);
                if (!createdLayer) throw new Error(`Failed to create layer: ${layer.name}`);
                this.layers[layer.name] = createdLayer;
                console.log(`Created layer: ${layer.name}`);
            });
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
        const debugInfo = [
            `Map: ${this.map.width}x${this.map.height} tiles (${this.map.widthInPixels}x${this.map.heightInPixels}px)`,
            `Tilesets loaded: ${this.map.tilesets.length}`,
            `Layers created: ${Object.keys(this.layers).length}`,
            'Layers:'
        ];

        Object.keys(this.layers).forEach(layerName => {
            debugInfo.push(`- ${layerName}`);
        });

        this.debugText = this.add.text(10, 10, debugInfo, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(1000);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
