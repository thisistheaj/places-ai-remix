import { useRef, useState, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';
import { subscribeToConnectedPlayers, setupPresenceTracking } from './lib/firebase';
import { useAuth } from './lib/auth';

function App()
{
    const { user } = useAuth();
    
    // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });
    const [connectedPlayers, setConnectedPlayers] = useState(0);

    // Set up presence tracking when the user is authenticated
    useEffect(() => {
        if (user?.uid) {
            // Set up presence tracking for this user
            const cleanup = setupPresenceTracking(user.uid);
            
            // Clean up when the component unmounts or the user changes
            return cleanup;
        }
    }, [user?.uid]);

    // Listen for connected players
    useEffect(() => {
        // Subscribe to player count updates
        const unsubscribe = subscribeToConnectedPlayers(setConnectedPlayers);
        
        // Clean up subscription on unmount
        return () => unsubscribe();
    }, []);

    // Add CSS for game controls
    useEffect(() => {
        // Create a style element for the game controls
        const style = document.createElement('style');
        style.textContent = `
            .game-controls-panel {
                position: fixed;
                left: 1rem;
                top: 5rem;
                z-index: 30;
                background-color: rgba(30, 30, 50, 0.9);
                backdrop-filter: blur(8px);
                padding: 1rem;
                border-radius: 0.5rem;
                border: 1px solid rgba(217, 70, 239, 0.3);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                max-width: 16rem;
            }
            
            .game-controls-title {
                font-size: 1.125rem;
                font-weight: 500;
                color: #d946ef;
                margin-bottom: 0.75rem;
                font-family: 'Press Start 2P', monospace;
                letter-spacing: -0.05em;
            }
            
            .game-controls-container {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .game-control-button {
                color: #d946ef;
                background-color: rgba(30, 30, 50, 0.8);
                border: 1px solid rgba(217, 70, 239, 0.3);
                padding: 0.5rem 0.75rem;
                border-radius: 0.25rem;
                font-family: monospace;
                display: block;
                width: 100%;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.875rem;
            }
            
            .game-control-button:hover {
                background-color: rgba(217, 70, 239, 0.2);
                border-color: rgba(217, 70, 239, 0.5);
            }
            
            .game-control-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .position-info {
                margin-top: 0.5rem;
                padding-top: 0.5rem;
                border-top: 1px solid rgba(217, 70, 239, 0.3);
                color: #d946ef;
                font-family: monospace;
                font-size: 0.875rem;
            }
            
            .position-info pre {
                background-color: rgba(30, 30, 50, 0.5);
                padding: 0.5rem;
                border-radius: 0.25rem;
                margin-top: 0.25rem;
                white-space: pre-wrap;
            }
            
            .stats-info {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background-color: rgba(30, 30, 50, 0.5);
                border-radius: 0.25rem;
                color: #d946ef;
                font-family: monospace;
                font-size: 0.875rem;
            }
            
            .stats-value {
                display: inline-block;
                margin-left: 0.5rem;
                color: white;
                font-weight: bold;
            }
            
            .navigation-buttons {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
                padding-top: 0.5rem;
                border-top: 1px solid rgba(217, 70, 239, 0.3);
            }
            
            .navigation-button {
                flex: 1;
                color: #d946ef;
                background-color: rgba(30, 30, 50, 0.8);
                border: 1px solid rgba(217, 70, 239, 0.3);
                padding: 0.5rem;
                border-radius: 0.25rem;
                font-family: monospace;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.75rem;
                text-decoration: none;
            }
            
            .navigation-button:hover {
                background-color: rgba(217, 70, 239, 0.2);
                border-color: rgba(217, 70, 239, 0.5);
            }
            
            /* Make sure the game canvas is centered */
            canvas {
                display: block;
                margin: 0 auto;
            }
            
            /* Hide the original controls div that was in the original code */
            #app > div:nth-child(2):not(.game-controls-panel) {
                display: none;
            }
        `;
        
        // Append to head
        document.head.appendChild(style);
        
        // Clean up on unmount
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const changeScene = () => {

        if(phaserRef.current)
        {     
            const scene = phaserRef.current.scene as MainMenu;
            
            if (scene)
            {
                scene.changeScene();
            }
        }
    }

    const moveSprite = () => {

        if(phaserRef.current)
        {

            const scene = phaserRef.current.scene as MainMenu;

            if (scene && scene.scene.key === 'MainMenu')
            {
                // Get the update logo position
                scene.moveLogo(({ x, y }) => {

                    setSpritePosition({ x, y });

                });
            }
        }

    }

    const addSprite = () => {

        if (phaserRef.current)
        {
            const scene = phaserRef.current.scene;

            if (scene)
            {
                // Add more stars
                const x = Phaser.Math.Between(64, scene.scale.width - 64);
                const y = Phaser.Math.Between(64, scene.scale.height - 64);
    
                //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
                const star = scene.add.sprite(x, y, 'star');
    
                //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
                //  You could, of course, do this from within the Phaser Scene code, but this is just an example
                //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
                scene.add.tween({
                    targets: star,
                    duration: 500 + Math.random() * 1000,
                    alpha: 0,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {

        setCanMoveSprite(scene.scene.key !== 'MainMenu');
        
    }

    const handleRestart = () => {
        window.location.reload();
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            
            {/* Game Controls Panel */}
            <div className="game-controls-panel">
                <div className="game-controls-title">Game Controls</div>
                <div className="game-controls-container">
                    <div className="stats-info">
                        Players Connected: <span className="stats-value">{connectedPlayers}</span>
                    </div>
                    
                    <button className="game-control-button" onClick={changeScene}>
                        Change Scene
                    </button>
                    <button 
                        disabled={canMoveSprite} 
                        className="game-control-button" 
                        onClick={moveSprite}
                    >
                        Toggle Movement
                    </button>
                    <button className="game-control-button" onClick={addSprite}>
                        Add New Sprite
                    </button>
                    
                    <div className="position-info">
                        Sprite Position:
                        <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
                    </div>
                    
                    {/* Navigation buttons */}
                    <div className="navigation-buttons">
                        <a href="/" className="navigation-button">
                            Home
                        </a>
                        <button className="navigation-button" onClick={handleRestart}>
                            Restart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
