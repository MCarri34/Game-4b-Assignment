import { PlayerControls } from './Player.js';

export class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }
        // Preload the animated lib file
    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    create() {
        // Player spawnpoint
        this.spawnpointX = 200;
        this.spawnpointY = 0;

        // Create Layers, only a test layer for now.
        this.map = this.make.tilemap({ key: "Level" });
        this.tileset = this.map.addTilesetImage("onebit_packed", "tilemap_tiles");
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.testLayer = this.map.createLayer("Test", this.tileset, 0, 0);
        this.testLayer.setCollisionByProperty({ collides: true });

        // Create Cursors 
        this.cursors = this.input.keyboard.createCursorKeys();

        // Player Instantiation
        this.playerControls = new PlayerControls(this, this.cursors);
        this.player = this.playerControls.getSprite();
        this.player.setVisible(true);
        this.player.setPosition(this.spawnpointX, this.spawnpointY);                // Spawn player at stored spawn position
        this.player.body.setSize(16, 16);                                           // Adjust hitbox
        this.player.body.setOffset(0, 1);
        this.isTouchingWall = false;                                                // Variable for wall jump   

        this.physics.add.collider(this.player, this.testLayer, (player, tile) => {  // Set up collider for walls that check if the player body is touching a wall in any way shape or form
            const body = player.body;

            if (
                body.blocked.left || body.blocked.right ||
                body.touching.left || body.touching.right ||
                body.embedded
            ) {
                this.isTouchingWall = true;                                         // If touching a wall, callback set isTouchingWall to true, else set it to false.
            } else {
                this.isTouchingWall = false;
            }
        }, null, this);

        this.cameras.main.setZoom(2);                                               // Basic camera for the play for now
        this.cameras.main.startFollow(this.player);

        // Debug key
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }, this);
    }


        // Update Function
    update() {
        this.playerControls.update();
    }
}
