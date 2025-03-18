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
        'Lounge/Couches Center Top',
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

    // Grid-based movement and animation
    private gridPos = { x: 0, y: 0 };
    private lastMoveTime = 0;
    private readonly IDLE_FRAME_RATE = 8;
    private readonly WALK_FRAME_RATE = 24;
    // ms between moves as an even multiple of the frame rate
    private readonly MOVE_COOLDOWN = this.WALK_FRAME_RATE*10; 
    // Animation must complete slightly before the next move to not look jerky
    private readonly ANIMATION_VS_COOLDOWN = 0.95;
    private debugGraphics: Phaser.GameObjects.Graphics;

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
        
        // Calculate spawn position in grid coordinates
        const centerGridX = Math.floor(this.map.widthInPixels / this.gridSize / 2);
        const centerGridY = Math.floor(this.map.heightInPixels / this.gridSize / 2);
        
        // Apply the random offset in grid coordinates
        this.gridPos = {
            x: centerGridX + Phaser.Math.Between(spawnArea.minX, spawnArea.maxX),
            y: centerGridY + Phaser.Math.Between(spawnArea.minY, spawnArea.maxY)
        };
        
        // Convert grid position to pixels for sprite placement
        const pixelX = (this.gridPos.x * this.gridSize) + (this.gridSize / 2);
        const pixelY = (this.gridPos.y * this.gridSize) + this.gridSize; // Align to bottom of grid
        
        this.player = this.add.sprite(pixelX, pixelY, 'player', 3);
        this.player.setOrigin(0.5, 1.0); // Set origin to bottom center
        this.player.setDepth(this.PLAYER_DEPTH);
        this.player.play(`idle-${this.facing}`)

        // Initialize debug graphics if debug is enabled
        if (DEBUG_ENABLED) {
            this.debugGraphics = this.add.graphics();
            this.debugGraphics.setDepth(this.PLAYER_DEPTH - 0.1); // Just below player
        }

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
                frameRate: this.IDLE_FRAME_RATE,
                repeat: -1
            });

            // Create walk animations
            this.anims.create({
                key: `walk-${direction}`,
                frames: this.anims.generateFrameNumbers('player', { 
                    start: 112 + (index * 6), 
                    end: 117 + (index * 6) 
                }),
                frameRate: this.WALK_FRAME_RATE,
                repeat: -1
            });
        });
    }

    private canMoveToTile(x: number, y: number): boolean {
        // Check if position is within map bounds
        if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) {
            return false;
        }

        // Check all collision layers for tiles at this position
        return !this.collisionLayers.some(layerPath => {
            const layer = this.layers[layerPath];
            if (!layer) return false;
            const tile = layer.getTileAt(x, y);
            return tile && tile.index !== -1; // Tile exists and isn't empty
        });
    }

    private tryMove(direction: Direction): boolean {
        const now = Date.now();
        if (now - this.lastMoveTime < this.MOVE_COOLDOWN) {
            return false;
        }

        // If facing different direction, just turn and start appropriate animation
        if (direction !== this.facing) {
            this.facing = direction;
        }
        this.player.play(`walk-${this.facing}`);

        // Calculate target position
        let newX = this.gridPos.x;
        let newY = this.gridPos.y;
        
        switch (direction) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }

        // Check if we can move there
        if (!this.canMoveToTile(newX, newY)) {
            setTimeout(() => {
                this.player.play(`idle-${this.facing}`);
            }, this.MOVE_COOLDOWN * this.ANIMATION_VS_COOLDOWN);
            return false;
        }

        // Update position and start movement animation
        this.gridPos.x = newX;
        this.gridPos.y = newY;
        this.lastMoveTime = now;
        
        // Update sprite position
        const pixelX = (this.gridPos.x * this.gridSize) + (this.gridSize / 2);
        const pixelY = (this.gridPos.y * this.gridSize) + this.gridSize; // Align to bottom of grid
        
        this.add.tween({
            targets: this.player,
            x: pixelX,
            y: pixelY,
            duration: this.MOVE_COOLDOWN * this.ANIMATION_VS_COOLDOWN,
            ease: 'Linear',
            onComplete: () => {
                this.player.play(`idle-${this.facing}`);
            }
        });

        return true;
    }

    update() {
        if (this.cursors.up.isDown) {
            this.isMoving = this.tryMove('up');
        } else if (this.cursors.down.isDown) {
            this.isMoving = this.tryMove('down');
        } else if (this.cursors.left.isDown) {
            this.isMoving = this.tryMove('left');
        } else if (this.cursors.right.isDown) {
            this.isMoving = this.tryMove('right');
        }

        // Update debug visuals
        if (DEBUG_ENABLED) {
            this.updateDebugVisuals();
        }
    }

    private updateDebugVisuals() {
        // Clear previous debug graphics
        this.debugGraphics.clear();

        // Draw current grid cell
        this.debugGraphics.lineStyle(2, 0xff00ff, 0.8);
        const cellX = this.gridPos.x * this.gridSize;
        const cellY = this.gridPos.y * this.gridSize;
        this.debugGraphics.strokeRect(cellX, cellY, this.gridSize, this.gridSize);

        // Draw target cell if moving
        if (this.isMoving) {
            let targetX = this.gridPos.x;
            let targetY = this.gridPos.y;
            
            switch (this.facing) {
                case 'up': targetY--; break;
                case 'down': targetY++; break;
                case 'left': targetX--; break;
                case 'right': targetX++; break;
            }

            this.debugGraphics.lineStyle(2, 0x00ff00, 0.5);
            const targetCellX = targetX * this.gridSize;
            const targetCellY = targetY * this.gridSize;
            this.debugGraphics.strokeRect(targetCellX, targetCellY, this.gridSize, this.gridSize);
        }
    }

    createDebugOverlay() {
        const debugInfo = [
            `Map: ${this.map.width}x${this.map.height} tiles (${this.map.widthInPixels}x${this.map.heightInPixels}px)`,
            `Camera bounds: ${this.camera.getBounds().width}x${this.camera.getBounds().height}`,
            `Tilesets loaded: ${this.map.tilesets.length}`,
            `Layers created: ${Object.keys(this.layers).length}`,
            `Player grid position: (${this.gridPos.x}, ${this.gridPos.y})`,
            `Player pixel position: (${this.player.x}, ${this.player.y})`,
            `Player facing: ${this.facing}`,
            'Layers (name: depth, collision):'
        ];

        Object.entries(this.layers).forEach(([name, layer]) => {
            const hasCollision = this.collisionLayers.includes(name);
            debugInfo.push(`- ${name}: depth=${layer.depth}, collision=${hasCollision}`);
        });
        debugInfo.push(`Player depth: ${this.player.depth}`);

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
