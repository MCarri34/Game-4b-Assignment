import { PlayerControls } from './Player.js';
import { EnemyControls } from './Enemies.js';

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
        
        // Enemy Instantiation
        this.enemies = [
            new EnemyControls(this, 600, 1400, 'onebit_tiles', this.testLayer),
        ]
        
        //Player Killing Enemies 
        this.enemies.forEach(enemyObj => {
            const enemy = enemyObj.getSprite();

            this.physics.add.collider(this.player, enemy, (player, enemy) => {
            // Check if player is falling and hitting the top
            const playerBottom = player.body.y + player.body.height;
            const enemyTop = enemy.body.y;

            if (player.body.velocity.y >= 0 && playerBottom <= enemyTop + 10) {
                // Player stomped the enemy
                enemyObj.enemy.disableBody(true, true); // Remove enemy
                player.body.velocity.y = -200; // Small bounce effect
            } else {
                // Optional: handle player damage here
                console.log('Player hit from the side or bottom!');
            }
        });
    });

        this.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 2, 2).generateTexture('whitePixel', 2, 2);
        

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
            this.playerControls.update();

            // Update all enemies
            this.enemies.forEach(enemy => {
                enemy.update();
            });
        }
}

