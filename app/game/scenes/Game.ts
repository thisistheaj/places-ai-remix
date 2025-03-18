import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

interface TiledLayerData extends Phaser.Tilemaps.LayerData {
    type?: string;
    layers?: TiledLayerData[];
}

type Direction = 'right' | 'up' | 'left' | 'down';

interface Controls {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
}

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    map: Phaser.Tilemaps.Tilemap;
    layers: {[key: string]: Phaser.Tilemaps.TilemapLayer} = {};
    debugText: Phaser.GameObjects.Text;
    player: Phaser.GameObjects.Sprite;
    
    // Movement controls
    cursors: Controls;
    isMoving: boolean = false;
    facing: Direction = 'down';
    gridSize: number = 32; // Size of one grid square

    // Layer depth configuration
    private readonly PLAYER_DEPTH = 1; // Base depth for player
    private readonly abovePlayerLayers = [
        'Conference/Tables Top',
        'Conference/Chairs Front',
        'Games/Tables Top',
        'Games/Decor',
        'Desks/Top',
        'Desks/Decor'
    ];  // Keep the simple name as it is in the layer.name

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

        // Create animations
        this.createAnimations();

        // Create player at the center of the map
        const centerX = (this.map.widthInPixels / 2) + (this.gridSize / 2); // Add 16px offset
        const centerY = this.map.heightInPixels / 2;
        this.player = this.add.sprite(centerX, centerY, 'player', 3); // Start facing down
        this.player.setDepth(this.PLAYER_DEPTH);
        
        // Set depths for layers that should render above player
        Object.entries(this.layers).forEach(([name, layer]) => {
            if (this.abovePlayerLayers.includes(name)) {
                layer.setDepth(this.PLAYER_DEPTH + 1);
            } else {
                layer.setDepth(0);
            }
        });

        // Make camera follow the player
        this.camera.startFollow(this.player);

        // Set up keyboard controls
        this.cursors = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D')
        };

        // Add debug text overlay
        this.createDebugOverlay();

        // Signal that the scene is ready
        EventBus.emit('current-scene-ready', this);
    }

    createAnimations() {
        // Create idle animations
        ['right', 'up', 'left', 'down'].forEach((direction, index) => {
            this.anims.create({
                key: `idle-${direction}`,
                frames: this.anims.generateFrameNumbers('player', { 
                    start: 56 + (index * 6), 
                    end: 61 + (index * 6) 
                }),
                frameRate: 8,
                repeat: -1
            });

            // Create walk animations
            this.anims.create({
                key: `walk-${direction}`,
                frames: this.anims.generateFrameNumbers('player', { 
                    start: 112 + (index * 6), 
                    end: 117 + (index * 6) 
                }),
                frameRate: 8,
                repeat: -1
            });
        });
    }

    update() {
        if (!this.isMoving) {
            // Check for movement input
            if (this.cursors.right.isDown) {
                this.startMoving('right');
            } else if (this.cursors.left.isDown) {
                this.startMoving('left');
            } else if (this.cursors.up.isDown) {
                this.startMoving('up');
            } else if (this.cursors.down.isDown) {
                this.startMoving('down');
            } else {
                // If no movement, play idle animation for current direction
                this.player.play(`idle-${this.facing}`, true);
            }
        }
    }

    startMoving(direction: Direction) {
        if (this.isMoving) return;

        this.isMoving = true;
        this.facing = direction;

        // Calculate target position
        let targetX = this.player.x;
        let targetY = this.player.y;

        switch (direction) {
            case 'right': targetX += this.gridSize; break;
            case 'left': targetX -= this.gridSize; break;
            case 'up': targetY -= this.gridSize; break;
            case 'down': targetY += this.gridSize; break;
        }

        // Play walking animation
        this.player.play(`walk-${direction}`, true);

        // Move to target position
        this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: 400, // Time to move one grid square
            ease: 'Linear',
            onComplete: () => {
                this.isMoving = false;
                // Switch to idle animation when movement completes
                this.player.play(`idle-${direction}`, true);
            }
        });
    }

    createDebugOverlay() {
        const debugInfo = [
            `Map: ${this.map.width}x${this.map.height} tiles (${this.map.widthInPixels}x${this.map.heightInPixels}px)`,
            `Tilesets loaded: ${this.map.tilesets.length}`,
            `Layers created: ${Object.keys(this.layers).length}`,
            'Layers (name: depth):'
        ];

        Object.entries(this.layers).forEach(([name, layer]) => {
            debugInfo.push(`- ${name}: ${layer.depth}`);
        });
        debugInfo.push(`Player depth: ${this.player.depth}`);
        debugInfo.push('Looking for layer: Conference Tables Top');

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
