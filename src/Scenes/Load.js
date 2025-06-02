export class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load spritesheets
        this.load.image('tilemap_packed', 'monochrome_tilemap_transparent_packed.png');
        this.load.atlas("game_characters", "monochrome_tilemap_transparent_packed.png")
        this.load.spritesheet('onebit_tiles', 'monochrome_tilemap_transparent_packed.png', {
            frameWidth: 16,
            frameHeight: 16,
            margin: 0,
            spacing: 0
        });


        // Load tilemap information
        this.load.image("tilemap_tiles", "monochrome_tilemap_transparent_packed.png");                         
        this.load.tilemapTiledJSON("Level", "Level.tmj");   
    }

    create() {

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('onebit_tiles', { start: 281, end: 284 }),
            frameRate: 10,  
            repeat: -1      
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('onebit_tiles', { start: 285, end: 285  }),
            frameRate: 10,  
            repeat: -1      
        });

        
        this.anims.create({
            key: 'idle',
            frames: [{key: 'onebit_tiles', frame: 280}, {key: 'onebit_tiles', frame: 300}],
            frameRate: 2,  
            repeat: -1      
        });
         this.scene.start("platformerScene");
    }

    update() {
    }
}