import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        // Load the basic images
        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        
        // Load the tilemap JSON file
        this.load.tilemapTiledJSON('office', 'tilemaps/office_1.json');
        
        // Load the tilesets
        this.load.image('generic', 'tilesets/1_Generic_32x32.png');
        this.load.image('livingroom', 'tilesets/2_LivingRoom_32x32.png');
        this.load.image('kitchen', 'tilesets/12_Kitchen_32x32.png');
        this.load.image('basement', 'tilesets/14_Basement_32x32.png');
        this.load.image('office-tiles', 'tilesets/Modern_Office_Shadowless_32x32.png');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move directly to the Game scene instead of MainMenu
        this.scene.start('Game');
    }
}
