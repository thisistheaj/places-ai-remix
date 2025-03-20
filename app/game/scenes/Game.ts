import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { subscribeToPlayers, updatePlayerPosition, updateLastSeen } from '~/lib/firebase';
import { Player, getPresenceStatus, getPresenceColor } from '~/models/player';

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
    player: Phaser.GameObjects.Container;
    playerSprite: Phaser.GameObjects.Sprite;
    userId: string | null = null;
    currentRoom: string | null = null;
    
    // Other players with their containers and components
    otherPlayers: {
        [key: string]: {
            container: Phaser.GameObjects.Container;
            sprite: Phaser.GameObjects.Sprite;
            nameText: Phaser.GameObjects.Text;
            presenceIndicator: Phaser.GameObjects.Arc;
        }
    } = {};
    
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

    // Base depth for sorting players
    private readonly BASE_PLAYER_DEPTH = 1000; // Use a large base number to avoid conflicts with map layers

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        
        // Set up camera
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x222222);

        // Create the tilemap
        this.map = this.make.tilemap({ key: 'office' });
        
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
        
        
        // Create layers
        const mapLayers = this.map.layers as TiledLayerData[];
        
        // Handle layer creation based on structure
        if (mapLayers.length > 0 && mapLayers[0].type === 'group') {
            // Handle grouped layers
            mapLayers.forEach(groupLayer => {
                if (groupLayer.type === 'group' && groupLayer.layers) {
                    groupLayer.layers.forEach(layer => {
                        if (layer.type === 'tilelayer') {
                            const fullLayerPath = `${groupLayer.name}/${layer.name}`;
                            const createdLayer = this.map.createLayer(fullLayerPath, tilesets, 0, 0);
                            if (!createdLayer) throw new Error(`Failed to create layer: ${fullLayerPath}`);
                            this.layers[fullLayerPath] = createdLayer;
                        }
                    });
                }
            });
        } else {
            // Handle flat layer structure
            mapLayers.forEach(layer => {
                const createdLayer = this.map.createLayer(layer.name, tilesets, 0, 0);
                console.log('Created layer:', layer.name);
                if (!createdLayer) throw new Error(`Failed to create layer: ${layer.name}`);
                this.layers[layer.name] = createdLayer;
            });
        }
        
        console.log('Created layers:', Object.keys(this.layers).join(', '));
        
        // Set up camera bounds based on the map size
        this.camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
        // Adjust the zoom level if needed
        // this.camera.setZoom(0.75); // Zoom out a bit to see more of the map

        // Create animations
        this.createAnimations();

        // Initialize player at a default position
        this.gridPos = {
            x: Math.floor(this.map.widthInPixels / this.gridSize / 2),
            y: Math.floor(this.map.heightInPixels / this.gridSize / 2)
        };

        // Create player container at default position
        const pixelX = (this.gridPos.x * this.gridSize) + (this.gridSize / 2);
        const pixelY = (this.gridPos.y * this.gridSize) + this.gridSize;
        
        this.player = this.add.container(pixelX, pixelY);
        this.updatePlayerDepth(this.player); // Set initial depth

        // Create player sprite and add to container
        this.playerSprite = this.add.sprite(0, 0, 'player', 3);
        this.playerSprite.setOrigin(0.5, 1.0);
        this.playerSprite.play(`idle-${this.facing}`);
        this.player.add(this.playerSprite);

        // Create name container for player
        const nameContainer = this.add.container(0, -57); // -25 - 32 to move it up one unit

        // Create name text
        const nameText = this.add.text(8, 0, 'Anonymous', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffffff'
        });
        nameText.setOrigin(0, 0.5);

        // Create background for name and presence indicator
        const padding = 16;
        const dotSize = 8;
        const nameBackground = this.add.rectangle(
            nameText.width/2 + padding/2 - dotSize,
            0,
            nameText.width + padding + dotSize,
            16,
            0x000000,
            0.5
        );
        nameBackground.setOrigin(0.5, 0.5);

        // Create presence indicator
        const presenceIndicator = this.add.circle(0, 0, 4, 0x00ff00);

        // Add everything to the name container
        nameContainer.add([nameBackground, presenceIndicator, nameText]);
        this.player.add(nameContainer);

        // Initialize debug graphics if debug is enabled
        if (DEBUG_ENABLED) {
            this.debugGraphics = this.add.graphics();
            this.debugGraphics.setDepth(this.PLAYER_DEPTH - 0.1);
        }

        // Set up collision detection
        this.handleCollisions();


        // Make camera follow the player container
        this.camera.startFollow(this.player, true);
        this.camera.setLerp(0.1, 0.1); // Add smooth follow

        // Set up keyboard controls
        const keyboard = this.input.keyboard;
        if (!keyboard) throw new Error('Keyboard input not available');
        
        this.cursors = {
            up: keyboard.addKey('W'),
            down: keyboard.addKey('S'),
            left: keyboard.addKey('A'),
            right: keyboard.addKey('D')
        };

        // Prevent WASD from being captured when chat is focused
        keyboard.disableGlobalCapture();
        
        // Add click handler to defocus chat input
        this.input.on('pointerdown', () => {
            const chatInput = document.querySelector('input[name="message"]') as HTMLInputElement;
            if (chatInput) {
                chatInput.blur();
            }
        });

        // Add debug text overlay only if debug is enabled
        if (DEBUG_ENABLED) {
            this.createDebugOverlay();
        }

        // Signal that the scene is ready
        EventBus.emit('current-scene-ready', this);

        // Update player depth when moving
        this.events.on('update', () => {
            this.updatePlayerDepth(this.player);
        });
        // Subscribe to player updates
        const unsubscribe = subscribeToPlayers((players) => {
            this.updateOtherPlayers(players);
        });

        // Cleanup subscription when scene is destroyed
        this.events.on('shutdown', () => {
            unsubscribe();
        });
        
        // Set up room detection
        const roomsLayer = this.map.getObjectLayer('Conference/Rooms');
        if (!roomsLayer) {
            console.warn('No Rooms layer found in tilemap');
        }
    }

    createAnimations() {
        // Create idle animations for all character skins
        for (let i = 1; i <= 20; i++) {
            const spriteNum = i.toString().padStart(2, '0');
            ['right', 'up', 'left', 'down'].forEach((direction, index) => {
                this.anims.create({
                    key: `idle-${direction}-${spriteNum}`,
                    frames: this.anims.generateFrameNumbers(`player${spriteNum}`, { 
                        start: 56 + (index * 6), 
                        end: 61 + (index * 6) 
                    }),
                    frameRate: this.IDLE_FRAME_RATE,
                    repeat: -1
                });

                // Create walk animations
                this.anims.create({
                    key: `walk-${direction}-${spriteNum}`,
                    frames: this.anims.generateFrameNumbers(`player${spriteNum}`, { 
                        start: 112 + (index * 6), 
                        end: 117 + (index * 6) 
                    }),
                    frameRate: this.WALK_FRAME_RATE,
                    repeat: -1
                });
            });
        }
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

        // Get current skin number
        const skinNum = this.playerSprite.texture.key.replace('player', '');

        // If facing different direction, just turn and start appropriate animation
        if (direction !== this.facing) {
            this.facing = direction;
        }
        this.playerSprite.play(`walk-${this.facing}-${skinNum}`);

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
                this.playerSprite.play(`idle-${this.facing}-${skinNum}`);
            }, this.MOVE_COOLDOWN * this.ANIMATION_VS_COOLDOWN);
            return false;
        }

        // Update position and start movement animation
        this.gridPos.x = newX;
        this.gridPos.y = newY;
        this.lastMoveTime = now;
        
        // Calculate target pixel position
        const pixelX = (this.gridPos.x * this.gridSize) + (this.gridSize / 2);
        const pixelY = (this.gridPos.y * this.gridSize) + this.gridSize;
        
        // Tween the container position
        this.add.tween({
            targets: this.player,
            x: pixelX,
            y: pixelY,
            duration: this.MOVE_COOLDOWN * this.ANIMATION_VS_COOLDOWN,
            ease: 'Linear',
            onUpdate: () => {
                this.updatePlayerDepth(this.player);
            },
            onComplete: () => {
                this.playerSprite.play(`idle-${this.facing}-${skinNum}`);
                this.updatePlayerDepth(this.player);
                // Update Firebase when movement is complete
                const uid = this.userId;
                if (uid) {
                    updatePlayerPosition(uid, this.gridPos.x, this.gridPos.y, this.facing, false);
                    updateLastSeen(uid); // Update lastSeenAt when moving
                }
            }
        });

        // Update Firebase that we're moving
        const uid = this.userId;
        if (uid) {
            updatePlayerPosition(uid, newX, newY, this.facing, true);
            updateLastSeen(uid); // Update lastSeenAt when moving
        }

        return true;
    }

    update() {
        // Only allow movement if not already moving
        if (this.isMoving) return;

        // Check if chat input is focused
        const chatInput = document.querySelector('input[name="message"]') as HTMLInputElement;
        const isChatFocused = chatInput?.matches(':focus');
        
        // Only capture keyboard events when chat is not focused
        if (!isChatFocused) {
            this.input.keyboard?.enableGlobalCapture();
        } else {
            this.input.keyboard?.disableGlobalCapture();
            return;
        }

        // Handle movement based on input
        if (this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown && !this.cursors.down.isDown) {
            this.tryMove('left');
        } else if (this.cursors.right.isDown && !this.cursors.left.isDown && !this.cursors.up.isDown && !this.cursors.down.isDown) {
            this.tryMove('right');
        } else if (this.cursors.up.isDown && !this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.down.isDown) {
            this.tryMove('up');
        } else if (this.cursors.down.isDown && !this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown) {
            this.tryMove('down');
        }

        // Check room bounds after movement
        this.checkRoomBounds();

        // Update debug visuals if enabled
        if (DEBUG_ENABLED) {
            this.updateDebugVisuals();
        }

        // Update nearby players
        this.updateNearbyPlayers();
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

        // Draw room boundaries if in debug mode
        if (this.map.getObjectLayer('Conference/Rooms')) {
            this.map.getObjectLayer('Conference/Rooms')?.objects.forEach(room => {
                if (room.x === undefined || room.y === undefined || 
                    room.width === undefined || room.height === undefined) return;

                this.debugGraphics.lineStyle(2, 0x00ff00, 0.3);
                this.debugGraphics.strokeRect(room.x, room.y, room.width, room.height);
                
                if (room.name === this.currentRoom) {
                    this.debugGraphics.lineStyle(2, 0x00ff00, 0.8);
                    this.debugGraphics.strokeRect(room.x, room.y, room.width, room.height);
                }
            });
        }
    }

    createDebugOverlay() {
        const debugInfo = [
            `Map: ${this.map.width}x${this.map.height} tiles (${this.map.widthInPixels}x${this.map.heightInPixels}px)`,
            `Camera bounds: ${this.camera.getBounds().width}x${this.camera.getBounds().height}`,
            `Tilesets loaded: ${this.map.tilesets.length}`,
            `Layers created: ${Object.keys(this.layers).length}`,
            `Player grid position: (${this.gridPos.x}, ${this.gridPos.y})`,
            `Player facing: ${this.facing}`,
            'Layers (name: depth, collision):'
        ];

        Object.entries(this.layers).forEach(([name, layer]) => {
            const hasCollision = this.collisionLayers.includes(name);
            debugInfo.push(`- ${name}: depth=${layer.depth}, collision=${hasCollision}`);
        });

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

    private updateNearbyPlayers() {
        if (!this.player) return;

        // Check each player for proximity (1 tile distance)
        let closestPlayer: { id: string; name: string } | null = null;
        let minDistance = Infinity;

        Object.entries(this.otherPlayers).forEach(([playerId, playerObj]) => {
            const container = playerObj.container as Phaser.GameObjects.Container & Phaser.GameObjects.Components.Transform;
            const distance = Phaser.Math.Distance.Between(
                this.gridPos.x,
                this.gridPos.y,
                Math.floor(container.x / this.gridSize),
                Math.floor(container.y / this.gridSize)
            );
            
            if (distance <= 1.5 && distance < minDistance) { // Using 1.5 to account for diagonal tiles
                minDistance = distance;
                closestPlayer = {
                    id: playerId,
                    name: playerObj.nameText.text
                };
            }
        });

        // Emit event with closest player or null if none are nearby
        EventBus.emit('nearby-player', closestPlayer);
    }

    // Update the depth of a player container based on its Y position
    private updatePlayerDepth(container: Phaser.GameObjects.Container) {
        // Y position divided by grid size gives us the grid Y coordinate
        // Add a small fraction of X to ensure consistent ordering when players are on the same Y
        const depthValue = (container.y / this.gridSize) + (container.x / (this.gridSize * 1000));
        container.setDepth(this.BASE_PLAYER_DEPTH + depthValue);
    }

    private handleCollisions() {
        // Set up collision for specified layers
        Object.entries(this.layers).forEach(([layerPath, layer]) => {
            if (!layer || !(layer instanceof Phaser.Tilemaps.TilemapLayer)) {
                console.warn(`Invalid layer at ${layerPath}`);
                return;
            }
            
            if (this.collisionLayers.includes(layerPath)) {
                // Enable collision for all non-empty tiles
                layer.setCollisionByExclusion([-1]);
                
                // Add collider with player sprite
                this.physics.add.collider(this.playerSprite, layer);
                
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
            
            // Set layer depths
            if (this.abovePlayerLayers.includes(layerPath)) {
                layer.setDepth(this.PLAYER_DEPTH + 2001);
            } else if (this.abovePlayerDecorLayers.includes(layerPath)) {
                layer.setDepth(this.PLAYER_DEPTH + 2002);
            } else {
                layer.setDepth(0);
            }
        });
    }

    private updateOtherPlayers(players: Record<string, Player>) {
        Object.entries(players).forEach(([uid, playerData]) => {
            // Skip if player data is invalid
            if (!playerData || typeof playerData.x !== 'number' || typeof playerData.y !== 'number') return;

            // Update our own position if this is our first time seeing it
            if (uid === this.userId && playerData) {
                // Always update our own skin even after initial position
                const skinNum = playerData.skin?.padStart(2, '0') || '01';
                if (this.playerSprite.texture.key !== `player${skinNum}`) {
                    this.playerSprite.setTexture(`player${skinNum}`);
                    // Restart the current animation with the new skin
                    if (this.isMoving) {
                        this.playerSprite.play(`walk-${this.facing}-${skinNum}`);
                    } else {
                        this.playerSprite.play(`idle-${this.facing}-${skinNum}`);
                    }
                }

                // Only update position if this is our first time
                if (this.lastMoveTime === 0) {
                    this.updateOwnInitialPosition(playerData);
                }
                return;
            }

            // Skip our own player after initial position
            if (uid === this.userId) return;

            // Handle other players
            this.handleOtherPlayer(uid, playerData);
        });

        // Remove disconnected players
        Object.keys(this.otherPlayers).forEach((uid) => {
            if (!players[uid]) {
                this.otherPlayers[uid].container.destroy();
                delete this.otherPlayers[uid];
            }
        });
    }

    private updateOwnInitialPosition(playerData: Player) {
        // Only update if we haven't moved yet (lastMoveTime is 0)
        if (this.lastMoveTime === 0 && typeof playerData.x === 'number' && typeof playerData.y === 'number') {
            this.gridPos.x = playerData.x;
            this.gridPos.y = playerData.y;
            const pixelX = (this.gridPos.x * this.gridSize) + (this.gridSize / 2);
            const pixelY = (this.gridPos.y * this.gridSize) + this.gridSize;
            this.player.setPosition(pixelX, pixelY);
            this.updatePlayerDepth(this.player);
            this.facing = playerData.direction as Direction || 'down';
            
            // Use the player's selected skin or default to '01'
            const skinNum = playerData.skin?.padStart(2, '0') || '01';
            this.playerSprite.setTexture(`player${skinNum}`);
            this.playerSprite.play(`idle-${this.facing}-${skinNum}`);
            
            // Update player name if it exists
            const nameContainer = (this.player as Phaser.GameObjects.Container).getAt(1) as Phaser.GameObjects.Container;
            const nameText = nameContainer.getAt(2) as Phaser.GameObjects.Text;
            const nameBackground = nameContainer.getAt(0) as Phaser.GameObjects.Rectangle;
            
            if (playerData.name && nameText && nameBackground) {
                nameText.setText(playerData.name);
                // Recalculate background width
                const padding = 16;
                const dotSize = 8;
                nameBackground.setSize(
                    nameText.width + padding + dotSize,
                    16
                );
                nameBackground.setPosition(nameText.width/2 + padding/2 - dotSize, 0);
            }
        }
    }

    private handleOtherPlayer(uid: string, playerData: Player) {
        // Check if other player is offline
        const status = getPresenceStatus(playerData);
        if (status === 'offline') {
            // Remove offline player if they exist
            if (this.otherPlayers[uid]) {
                this.otherPlayers[uid].container.destroy();
                delete this.otherPlayers[uid];
            }
            return;
        }

        // Create or update other player
        if (!this.otherPlayers[uid]) {
            this.createOtherPlayer(uid, playerData);
        } else {
            this.updateExistingPlayer(uid, playerData);
        }
    }

    private createOtherPlayer(uid: string, playerData: Player) {
        // Create container for player and their name/presence
        const container = this.add.container(
            (playerData.x * this.gridSize) + (this.gridSize / 2),
            (playerData.y * this.gridSize) + this.gridSize
        );
        this.updatePlayerDepth(container);

        // Create player sprite with the selected skin or default
        const skinNum = playerData.skin?.padStart(2, '0') || '01';
        const sprite = this.add.sprite(0, 0, `player${skinNum}`);
        sprite.setOrigin(0.5, 1.0);
        container.add(sprite);

        // Create name container
        const nameContainer = this.add.container(0, -57);

        // Create name text
        const nameText = this.add.text(8, 0, playerData.name || 'Anonymous', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffffff'
        });
        nameText.setOrigin(0, 0.5);

        // Create background for name and presence indicator
        const padding = 16;
        const dotSize = 8;
        const nameBackground = this.add.rectangle(
            nameText.width/2 + padding/2 - dotSize,
            0,
            nameText.width + padding + dotSize,
            16,
            0x000000,
            0.5
        );
        nameBackground.setOrigin(0.5, 0.5);

        // Create presence indicator
        const status = getPresenceStatus(playerData);
        const presenceIndicator = this.add.circle(0, 0, 4, getPresenceColor(status));

        // Add everything to the name container
        nameContainer.add([nameBackground, presenceIndicator, nameText]);
        container.add(nameContainer);

        // Store references
        this.otherPlayers[uid] = {
            container,
            sprite,
            nameText,
            presenceIndicator
        };
    }

    private updateExistingPlayer(uid: string, playerData: Player) {
        const playerObj = this.otherPlayers[uid];
        const skinNum = playerData.skin?.padStart(2, '0') || '01';
        
        // Update sprite texture if skin changed
        if (playerObj.sprite.texture.key !== `player${skinNum}`) {
            playerObj.sprite.setTexture(`player${skinNum}`);
        }
        
        // Update position with tween if moving
        if (playerData.moving) {
            this.add.tween({
                targets: playerObj.container,
                x: (playerData.x * this.gridSize) + (this.gridSize / 2),
                y: (playerData.y * this.gridSize) + this.gridSize,
                duration: this.MOVE_COOLDOWN * this.ANIMATION_VS_COOLDOWN,
                ease: 'Linear',
                onUpdate: () => {
                    this.updatePlayerDepth(playerObj.container);
                },
                onComplete: () => {
                    (playerObj.sprite as any).play(`idle-${playerData.direction}-${skinNum}`);
                    this.updatePlayerDepth(playerObj.container);
                }
            });
            (playerObj.sprite as any).play(`walk-${playerData.direction}-${skinNum}`);
        } else {
            // Update position immediately if not moving
            playerObj.container.setPosition(
                (playerData.x * this.gridSize) + (this.gridSize / 2),
                (playerData.y * this.gridSize) + this.gridSize
            );
            this.updatePlayerDepth(playerObj.container);
            (playerObj.sprite as any).play(`idle-${playerData.direction}-${skinNum}`);
        }

        // Update name if changed
        if (playerData.name !== playerObj.nameText.text) {
            playerObj.nameText.setText(playerData.name || 'Anonymous');
        }

        // Update presence indicator color
        const newStatus = getPresenceStatus(playerData);
        playerObj.presenceIndicator.setFillStyle(getPresenceColor(newStatus));
    }

    private checkRoomBounds() {
        if (!this.map) return;

        const roomsLayer = this.map.getObjectLayer('Conference/Rooms');
        if (!roomsLayer) return;

        const playerX = this.player.x;
        const playerY = this.player.y;
        let newRoom: string | null = null;

        // Check if player is in any room
        roomsLayer.objects.forEach(room => {
            if (room.x === undefined || room.y === undefined || 
                room.width === undefined || room.height === undefined || 
                !room.name) return;

            if (playerX >= room.x && 
                playerX <= room.x + room.width &&
                playerY >= room.y && 
                playerY <= room.y + room.height) {
                newRoom = room.name;
            }
        });

        // If room changed, emit event
        if (newRoom !== this.currentRoom) {
            const oldRoom = this.currentRoom;
            this.currentRoom = newRoom;
            EventBus.emit('room-changed', { 
                oldRoom, 
                newRoom,
                userId: this.userId 
            });
        }
    }
}
