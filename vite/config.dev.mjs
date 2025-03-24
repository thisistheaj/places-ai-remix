import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { exec } from "child_process";
import { resolve } from "path";

installGlobals();

// Custom plugin to watch and fix tilemap paths
const tilemapWatcher = () => {
    let lastRun = 0;
    const COOLDOWN = 1000; // 1 second cooldown

    return {
        name: 'tilemap-watcher',
        configureServer(server) {
            const tilemapPath = resolve('public/assets/tilemaps/office_1.json');
            server.watcher.add(tilemapPath);
            server.watcher.on('change', (path) => {
                if (path === tilemapPath) {
                    const now = Date.now();
                    if (now - lastRun < COOLDOWN) {
                        return; // Skip if within cooldown
                    }
                    lastRun = now;
                    
                    console.log('🗺️  Tilemap changed, fixing paths...');
                    exec('npm run fix-paths', (error) => {
                        if (error) console.error('Error fixing paths:', error);
                        else console.log('✅ Paths fixed!');
                    });
                }
            });
        }
    };
};

export default defineConfig({
    plugins: [
        remix({
            ssr: true,
        }),
        tsconfigPaths(),
        tilemapWatcher()
    ],
    server: {
        port: 8080,
        hmr: {
            port: 8002
        }
    }
});
