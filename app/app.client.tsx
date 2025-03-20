import { useRef, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { useAuth } from './lib/auth';
import { Chat } from './components/chat/Chat';

function App()
{
    const { user } = useAuth();

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);    
    
    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        
        // If this is the Game scene and we have a user ID, set it
        if (scene.scene.key === 'Game') {
            if (user?.uid) {
                (scene as any).userId = user.uid;
            }
        }
    }

    return (
        <>
            <div id="app">
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            </div>
            <Chat />
        </>
    )
}

export default App
