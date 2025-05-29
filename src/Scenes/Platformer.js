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
        this.spawnpointX = 250;
        this.spawnpointY = 1434;

        // Create Layers, only a test layer for now.
        this.map = this.make.tilemap({ key: "Level" });
        this.tileset = this.map.addTilesetImage("onebit_packed", "tilemap_tiles");
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.testLayer = this.map.createLayer("Test", this.tileset, 0, 0);
        this.decorationLayer = this.map.createLayer("Decoration", this.tileset, 0,0);
        this.subDecorationLayer = this.map.createLayer("SubDecoration", this.tileset, 0,0);
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
        this.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 2, 2).generateTexture('whitePixel', 2, 2);
        
        //Particle Emitters
        this.walkingEmitter1 = this.add.particles(this.player.x, this.player.y, 'whitePixel', {
            lifespan: { min: 200, max: 1000 },                                      // Cone emitter for walking in direction one
            speed: { min: 30, max: 100 },                
            scale: { start: 2, end: 0 },
            quantity: 5,
            frequency: 50,
            alpha: { start: 0.7, end: 0 },
            tint: 0x666666,
            angle: { min: 160, max: 200 },
            blendMode: Phaser.BlendModes.NORMAL
        });
        this.walkingEmitter2 = this.add.particles(this.player.x, this.player.y, 'whitePixel', {
            lifespan: { min: 200, max: 1000 },                                      // Cone emitter for walking in direction two
            speed: { min: 30, max: 100 },                
            scale: { start: 2, end: 0 },
            quantity: 5,
            frequency: 50,
            alpha: { start: 0.7, end: 0 },
            tint: 0x666666,
            angle: { min: 340, max: 380 },
            blendMode: Phaser.BlendModes.NORMAL
        });


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
        }, this.oneWayPlatformCollide, this);

        this.cameras.main.setZoom(2);                                               // Basic camera for the play for now
        this.cameras.main.startFollow(this.player);

        // Debug key
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }, this);
    }
    
    oneWayPlatformCollide(player, tile) {
        if (!tile.properties.solid) {
            return player.body.velocity.y >= 1;
        } else {
            return true;
        }
    }


        // Update Function
        update() {
            const p = this.player;
            const emitter1 = this.walkingEmitter1;
            const emitter2 = this.walkingEmitter2;

            if (Math.abs(p.body.velocity.x) > 2 && p.body.blocked.down) {
                emitter1.setPosition(p.body.x, p.body.y+16);
                emitter2.setPosition(p.body.x+16, p.body.y+16);
                if (p.body.velocity.x > 0) {
                    emitter2.stop()
                    emitter1.start();
                } else if (p.body.velocity.x < 0) {
                    emitter1.stop();
                    emitter2.start();
                }
            } else {
                emitter1.stop();
                emitter2.stop();
            }

            this.playerControls.update();
        }
}

