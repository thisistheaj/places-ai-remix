import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

const DEBUG_ENABLED = false; // Toggle all debug visualizations

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
        'Conference/Walls Top',
        'Games/Tables Top',
        'Games/Decor',
        'Desks/Top',
        'Desks/Decor',
        'Lounge/Decor South',
        'Lounge/Tables Top',
        'Lounge/Couches South Top'
    ];  // Keep the simple name as it is in the layer.name
    private readonly abovePlayerDecorLayers = [
        'Conference/Decor Walls Top',
        'Lounge/Decor North Top',
        'Lounge/Decor Center Top',
        'Games/Decor Top',
        'Decor Tables Top',
        'Lounge/Decor Center Top'
    ]

    // Collision configuration
    private readonly collisionLayers = [
        'Base/Walls',
        'Desks/Bottom',
        'Conference/Walls',
        'Conference/Tables Middle',
        'Conference/Tables Bottom',
        'Games/Tables Middle',
        'Lounge/Tables',
        'Lounge/Couches Center Backs',
    ];

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
        
        // Debug map dimensions
        console.log('Map dimensions:', {
            tileWidth: this.map.tileWidth,
            tileHeight: this.map.tileHeight,
            width: this.map.width,
            height: this.map.height,
            widthInPixels: this.map.widthInPixels,
            heightInPixels: this.map.heightInPixels
        });
        
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
        console.log('Layer types:', mapLayers.map(l => `${l.name}: ${l.type}`).join(', '));
        
        // Handle layer creation based on structure
        if (mapLayers.length > 0 && mapLayers[0].type === 'group') {
            // Handle grouped layers
            mapLayers.forEach(groupLayer => {
                if (groupLayer.type === 'group' && groupLayer.layers) {
                    console.log(`Processing group: ${groupLayer.name}`);
                    groupLayer.layers.forEach(layer => {
                        if (layer.type === 'tilelayer') {
                            const fullLayerPath = `${groupLayer.name}/${layer.name}`;
                            console.log(`Creating layer: ${fullLayerPath}`);
                            const createdLayer = this.map.createLayer(fullLayerPath, tilesets, 0, 0);
                            if (!createdLayer) throw new Error(`Failed to create layer: ${fullLayerPath}`);
                            this.layers[fullLayerPath] = createdLayer;
                            console.log(`Created layer: ${fullLayerPath}`);
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
        
        console.log('Created layers:', Object.keys(this.layers).join(', '));
        
        // Set physics world bounds to match map size
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        console.log('Physics world bounds:', this.physics.world.bounds);
        
        // Set up camera bounds based on the map size
        this.camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        console.log('Camera bounds:', this.camera.getBounds());
        
        // Adjust the zoom level if needed
        // this.camera.setZoom(0.75); // Zoom out a bit to see more of the map

        // Create animations
        this.createAnimations();

        // Calculate center of the map
        const centerX = (this.map.widthInPixels / 2) + (this.gridSize / 2);
        const centerY = this.map.heightInPixels / 2;

        // Create player at a random position within the specified rectangle relative to center
        const spawnArea = {
            minX: -28,
            maxX: -12,
            minY: -18,
            maxY: -13
        };
        
        // Convert grid coordinates to pixels and get random position relative to center
        const spawnX = centerX + (Phaser.Math.Between(spawnArea.minX, spawnArea.maxX) * this.gridSize);
        const spawnY = centerY + (Phaser.Math.Between(spawnArea.minY, spawnArea.maxY) * this.gridSize);
        
        this.player = this.add.sprite(spawnX, spawnY, 'player', 3);
        this.player.setDepth(this.PLAYER_DEPTH);

        // Enable physics on the player
        this.physics.world.enable(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        
        // Configure physics debug rendering
        this.physics.world.debugGraphic?.destroy(); // Remove any existing debug graphics
        if (DEBUG_ENABLED) {
            this.physics.world.createDebugGraphic();
            this.physics.world.debugGraphic.setAlpha(0.75);
        }
        this.physics.world.defaults.debugShowBody = DEBUG_ENABLED;
        this.physics.world.defaults.debugShowVelocity = DEBUG_ENABLED;
        
        // Set up half-height collision box at the bottom of the sprite
        body.setSize(32, 32);  // Set collision box to 32x32
        body.setOffset(0, 32); // Offset to bottom half of 64px sprite
        body.setCollideWorldBounds(true); // Prevent walking outside the map
        body.setBounce(0);     // No bounce on collision
        body.setDrag(0);       // No drag
        body.setFriction(0);   // No friction
        
        console.log('Player physics body:', {
            x: body.x,
            y: body.y,
            width: body.width,
            height: body.height,
            offset: body.offset
        });
        
        // Enable collision for specified layers
        Object.entries(this.layers).forEach(([layerPath, layer]) => {
            if (!layer || !(layer instanceof Phaser.Tilemaps.TilemapLayer)) {
                console.warn(`Invalid layer at ${layerPath}`);
                return;
            }
            
            if (this.collisionLayers.includes(layerPath)) {
                console.log(`Setting up collision for layer: ${layerPath}`);
                
                // Debug: Check tile properties
                const nonEmptyTiles = layer.filterTiles((tile: Phaser.Tilemaps.Tile) => tile.index !== -1);
                console.log(`Layer ${layerPath} has ${nonEmptyTiles.length} non-empty tiles`);
                
                // Enable collision for all non-empty tiles
                layer.setCollisionByExclusion([-1]);
                
                // Debug: Verify collision was set
                const collisionTiles = layer.filterTiles((tile: Phaser.Tilemaps.Tile) => tile.collides);
                console.log(`Layer ${layerPath} has ${collisionTiles.length} tiles with collision`);
                
                // Add collider
                const collider = this.physics.add.collider(this.player, layer);
                console.log(`Enabled collision for layer: ${layerPath}`);
                
                // Debug: Draw collision boxes if debug is enabled
                if (DEBUG_ENABLED) {
                    const debugGraphics = this.add.graphics().setAlpha(0.75);
                    layer.renderDebug(debugGraphics, {
                        tileColor: null,
                        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
                        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
                    });
                }
            }
            
            if (this.abovePlayerLayers.includes(layerPath)) {
                layer.setDepth(this.PLAYER_DEPTH + 1);
            } else if (this.abovePlayerDecorLayers.includes(layerPath)) {
                layer.setDepth(this.PLAYER_DEPTH + 2);
            } else {
                layer.setDepth(0);
            }
        });

        // Remove duplicate debug graphics creation
        // Debug: Enable physics debug rendering only if debug is enabled
        // if (DEBUG_ENABLED) {
        //     this.physics.world.createDebugGraphic();
        // }
        
        // Make camera follow the player
        this.camera.startFollow(this.player);

        // Set up keyboard controls
        const keyboard = this.input.keyboard;
        if (!keyboard) throw new Error('Keyboard input not available');
        
        this.cursors = {
            up: keyboard.addKey('W'),
            down: keyboard.addKey('S'),
            left: keyboard.addKey('A'),
            right: keyboard.addKey('D')
        };

        // Add debug text overlay only if debug is enabled
        if (DEBUG_ENABLED) {
            this.createDebugOverlay();
        }

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
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            const speed = 160; // Pixels per second (32 * 5)
            
            // Reset velocity
            body.setVelocity(0);

            // Check for movement input
            if (this.cursors.right.isDown) {
                body.setVelocityX(speed);
                this.facing = 'right';
                this.player.play(`walk-${this.facing}`, true);
            } else if (this.cursors.left.isDown) {
                body.setVelocityX(-speed);
                this.facing = 'left';
                this.player.play(`walk-${this.facing}`, true);
            } else if (this.cursors.up.isDown) {
                body.setVelocityY(-speed);
                this.facing = 'up';
                this.player.play(`walk-${this.facing}`, true);
            } else if (this.cursors.down.isDown) {
                body.setVelocityY(speed);
                this.facing = 'down';
                this.player.play(`walk-${this.facing}`, true);
            } else {
                // If no movement, play idle animation for current direction
                this.player.play(`idle-${this.facing}`, true);
            }
        }
    }

    createDebugOverlay() {
        const debugInfo = [
            `Map: ${this.map.width}x${this.map.height} tiles (${this.map.widthInPixels}x${this.map.heightInPixels}px)`,
            `Physics bounds: ${this.physics.world.bounds.width}x${this.physics.world.bounds.height}`,
            `Camera bounds: ${this.camera.getBounds().width}x${this.camera.getBounds().height}`,
            `Tilesets loaded: ${this.map.tilesets.length}`,
            `Layers created: ${Object.keys(this.layers).length}`,
            'Layers (name: depth, collision):'
        ];

        Object.entries(this.layers).forEach(([name, layer]) => {
            const hasCollision = this.collisionLayers.includes(name);
            debugInfo.push(`- ${name}: depth=${layer.depth}, collision=${hasCollision}`);
        });
        debugInfo.push(`Player depth: ${this.player.depth}`);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        debugInfo.push(`Player collision: ${body.width}x${body.height} at (${body.x},${body.y})`);

        // Create a semi-transparent black rectangle for the background
        const padding = { x: 5, y: 5 };
        const graphics = this.add.graphics();
        graphics.setScrollFactor(0);
        graphics.setDepth(999); // Just below the text

        this.debugText = this.add.text(10, 10, debugInfo, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            padding: padding
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(1000);

        // Draw semi-transparent background
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(
            this.debugText.x - padding.x, 
            this.debugText.y - padding.y,
            this.debugText.width + (padding.x * 2),
            this.debugText.height + (padding.y * 2)
        );
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
