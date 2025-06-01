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
        this.animatedTiles.init(this.map);

        // Power-up Animation
        this.anims.create({
            key: 'doubleJumpPowerUp',
            frames: this.anims.generateFrameNumbers('onebit_tiles', { frames: [62, 82] }),
            frameRate: 10,
            repeat: -1
        });


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
        // Player Collision Handling
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
        }, this.oneWayPlatformCollide, this);                                       // Collision Filter
        
        // Camera Instatiation
        this.cameras.main.setZoom(2);                                               // Basic camera for the play for now
        this.cameras.main.startFollow(this.player, true, 0, 1);                     // Follow the player with the camera (x-axis not)

        // Enemy Instantiation
        this.enemies = [
            new EnemyControls(this, 100, 1200, 'onebit_tiles', this.testLayer), //Spawn Enemy 1
            new EnemyControls(this, 275, 1150, 'onebit_tiles', this.testLayer), //Spawn Enemy 2
            new EnemyControls(this, 300, 1100, 'onebit_tiles', this.testLayer), //Spawn Enemy 3
            new EnemyControls(this, 300, 800, 'onebit_tiles', this.testLayer),  //Spawn Enemy 4
            new EnemyControls(this, 150, 800, 'onebit_tiles', this.testLayer),  //Spawn Enemy 5
            new EnemyControls(this, 600, 450, 'onebit_tiles', this.testLayer),  //Spawn Enemy 6

        ]
        
        // Create double jump power-up 
        this.doubleJumpPowerUps = this.physics.add.staticGroup();

        // Define positions for each power-up
        const powerUpPositions = [
            { x: 101.2, y: 624.8 },
            { x: 444.6, y: 512.8 },
            { x: 87.3, y: 407 },
        ];

        powerUpPositions.forEach(pos => {
            const powerUp = this.doubleJumpPowerUps.create(pos.x, pos.y, 'onebit_tiles', 62);
            powerUp.anims.play('doubleJumpPowerUp');
            powerUp.setSize(16, 16);
            powerUp.setOffset(0, 0);
            powerUp.setDepth(10);
            powerUp.refreshBody();  // Important for static bodies
        });


        // Handle player collecting the double jump power-up
        this.physics.add.overlap(this.player, this.doubleJumpPowerUps, (_, powerUp) => {
            console.log('Double Jump Power-Up Collected!');
            this.playerControls.hasDoubleJump = true;
            powerUp.destroy();
        }, null, this)


        // Interactable Object Instantiation
        const interactableObjects = this.map.getObjectLayer("Interactables").objects;
        this.pads = this.physics.add.staticGroup();
        interactableObjects.forEach(obj => {
            console.log
            const hitbox = this.physics.add.staticImage(obj.x , obj.y , 'onebit_tiles')        // Create hitbox object for object layer items
                .setOrigin(0, 1)    
                .refreshBody()     
                .setDepth(5);
            if (obj.gid) {                                                                          // If object uses sprite, use it-- else make the hitbox invisible
                hitbox.setVisible(true);
                hitbox.setFrame(obj.gid - 1);
            } else {
                hitbox.setVisible(false);
            }
            if (obj.properties) {
                obj.properties.forEach(p => {
                    hitbox[p.name] = p.value;
                });
            }
            if(hitbox.Type === 'Pad'){
                console.log('ee')
                this.pads.add(hitbox);
            }
        });
        this.physics.add.overlap(this.player, this.pads, this.bounce, null, this);

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

        // Debug key
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }, this);
    }

    bounce(player, pad){
        player.setVelocityY(pad.Boost);
    }

    // One Way Pass for collidables
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

