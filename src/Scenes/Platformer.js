import { PlayerControls } from './Player.js';
import { EnemyControls } from './Enemies.js';

export class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }
        // Preload the animated lib file
    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
        this.load.bitmapFont('pixelfont', 'assets/minogram_6x10.png', 'assets/minogram_6x10.xml');
        this.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 2, 2).generateTexture('whitePixel', 2, 2);

    }

    create() {
        // Gamestate Variables
        this.started = false;
        this.ended = false;
        this.paused = false;
        this.victorySoundPlayed = false;
        this.startTime = 0;
        this.finalTime = 0;
        this.deathCount = 0;
        this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);           // Player Inputs Other Than Movement
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.menuTextOne = this.add.bitmapText(200, 1342, 'pixelfont', 'CLIMB.EXE', 20);// Menu Texts
        this.menuTextTwo = this.add.bitmapText(200, 1362, 'pixelfont', 'Credits To: Noah Billedo, Michael Carrillo, Kenney Assets\nClimb to the top!', 5);
        this.menuTextThree = this.add.bitmapText(200, 1375, 'pixelfont', 'PRESS S TO START', 10);
        this.startTexts = [this.menuTextOne, this.menuTextTwo, this.menuTextThree];
        this.startTexts.forEach(textObj => {                                                // Fun little start menu tween
            this.tweens.add({
                targets: textObj,
                y: textObj.y - 5,        
                duration: 1000,          
                yoyo: true,              
                repeat: -1,              
                ease: 'Sine.easeInOut'
            });
        });


        // Player spawnpoint
        this.spawnpointX = 390;
        this.spawnpointY = 1434;

        // Create Layers, Animationsm, Emitters
        this.map = this.make.tilemap({ key: "Level" });
        this.tileset = this.map.addTilesetImage("onebit_packed", "tilemap_tiles");
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.testLayer = this.map.createLayer("Test", this.tileset, 0, 0);
        this.decorationLayer = this.map.createLayer("Decoration", this.tileset, 0,0);
        this.subDecorationLayer = this.map.createLayer("SubDecoration", this.tileset, 0,0);
        this.testLayer.setCollisionByProperty({ collides: true });
        this.animatedTiles.init(this.map);
        this.physics.world.TILE_BIAS = 15;
        this.anims.create({
            key: 'doubleJumpPowerUp',
            frames: this.anims.generateFrameNumbers('onebit_tiles', { frames: [62, 82] }),
            frameRate: 10,
            repeat: -1
        });

        // Create Cursors 
        this.cursors = this.input.keyboard.createCursorKeys();

        // Dialogue Text Holders
        this.box = this.add.graphics()
            .fillStyle(0x000000, 0.7)
            .lineStyle(4, 0x80EF80, 1)
            .setScrollFactor(0)
            .setVisible(false);
        this.dialogueBox = this.add.bitmapText(270, 600, 'pixelfont', '', 10)
            .setScrollFactor(0)
            .setVisible(false)
            .setDepth(999)

        // Player Instantiation
        this.playerControls = new PlayerControls(this, this.cursors);
        this.player = this.playerControls.getSprite();
        this.player.setVisible(true);
        this.player.setPosition(this.spawnpointX, this.spawnpointY);                // Spawn player at stored spawn position
        this.player.body.setSize(16, 16);                                           // Adjust hitbox
        this.player.body.setOffset(0, 1);
        this.isTouchingWall = false;                                                // Variable for wall jump
        this.dead = false;
        this.player.setVisible(false);

        this.sfx ={    // Adding Sound Effects
            jump: this.sound.add('jump'),
            walljump: this.sound.add('walljump'),
            dying: this.sound.add('dying'),
            enemykilled: this.sound.add('enemykilled'),
            doublejump: this.sound.add('doublejump'),
            coin: this.sound.add('coin'),
            bouncepad: this.sound.add('bouncepad'),
            powerup: this.sound.add('powerup'),
            move: this.sound.add('move'),
            victory: this.sound.add('victory')
        }
        this.playerControls.setSounds(this.sfx);                                         // Set player sounds

        // Player wall Jump Handling
        this.physics.add.collider(this.player, this.testLayer, (player, tile) => {
            this.handleDeadlyTiles(player, tile);

            const body = player.body;
            if (
                body.blocked.left || body.blocked.right ||
                body.touching.left || body.touching.right ||
                body.embedded
            ) {
                this.isTouchingWall = true;
            } else {
                this.isTouchingWall = false;
            }
        }, this.oneWayPlatformCollide, this);
        // Player Death Particles
        this.deathEmitter1 = this.add.particles(this.player.x, this.player.y, 'whitePixel', {
            lifespan: { min: 200, max: 1000 },        
            speed: { min: 50, max: 1 },                    
            gravityY: 0,                            
            scale: { start: 2, end: 0 },             
            quantity: 10,                            
            frequency: -1,                           
            alpha: { start: 1, end: 0 },
            tint: 0x999999,
            blendMode: Phaser.BlendModes.NORMAL
        });
        
        // Camera Instatiation
        this.cameras.main.setZoom(2);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, false, 0, 1);

        // Interactable Object Instantiation
        const interactableObjects = this.map.getObjectLayer("Interactables").objects;
        this.pads = this.physics.add.staticGroup();
        this.signs = this.physics.add.staticGroup();
        this.end = this.physics.add.staticGroup();
        interactableObjects.forEach(obj => {
            const hitbox = this.physics.add.staticImage(obj.x , obj.y , 'onebit_tiles')        // Create hitbox object for object layer items
                .setOrigin(0, 1)    
                .refreshBody()     
                .setDepth(5);
            if (obj.gid) {                                                                     // If object uses sprite, use it-- else make the hitbox invisible
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
                this.pads.add(hitbox);
            }
            if(hitbox.Type === 'Sign'){
                this.signs.add(hitbox);
            }
            if(hitbox.Type === 'End'){
                this.end.add(hitbox);
            }
        });
        this.physics.add.overlap(this.player, this.pads, this.bounce, null, this);
        this.physics.add.overlap(this.player, this.end, this.complete, null, this);

        // Spawn enemies and powerups
        this.spawnEnemies();
        this.spawnPowerUps();
    
        // Debug key
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
            }, this);
    }                                                                                       // End of CREATE()

    // Callback for bouncepads
    bounce(player, pad){
        if (this.sfx?.bouncepad) this.sfx.bouncepad.play();                                 // Play bounce pad sound
        player.setVelocityY(pad.Boost);
    }
    // Callback for player completion
    complete(player, end){
        if(!this.ended){
        this.finalTime = (this.time.now - this.startTime) / 1000;                           // Handle the player 'speed run timer' data. Calculate time from started to finished.
        this.ended = true;                                                                  // Set game end flag
        
        }
    }
    
    // Called when player is in overlap with a sign/text object from the objectlayer, shows the text
    showDialogueText(player, sign) {                                                                                          
            this.dialogueBox.setText(sign.Text);
            this.dialogueBox.setVisible(true);            
            this.box.setVisible(true);
            this.dialogueBorderUpdate();
            this.isTouchingSign = true;
        }

    // Dynamic dialogue box handling
    dialogueBorderUpdate(){
        const padding = 10;
        const textWidth = this.dialogueBox.width;                                               // get width and height of text for measurement
        const textHeight = this.dialogueBox.height;
        const boxWidth = textWidth + padding * 2;                                               // get box dimensions based off text
        const boxHeight = textHeight + padding * 2;
        this.box.clear();                                                                       // destroy the previous box
        this.box.fillStyle(0x000000, 0.7);                                                      // below sets the new box
        this.box.fillRect(this.dialogueBox.x - padding, this.dialogueBox.y - padding, boxWidth, boxHeight);
        this.box.lineStyle(2, 0xffffff, 1);
        this.box.strokeRect(this.dialogueBox.x - padding, this.dialogueBox.y - padding, boxWidth, boxHeight);
    }

    // Deadly Tile Handling
    handleDeadlyTiles(player, tile) {
    const isDeadly = (tile.properties && tile.properties.deadly) || tile.deadly;
    if (isDeadly && !this.dead) {                             
        this.playerKill();
    }
}
    // Player Death Handling
    playerKill(){
        console.log("PLAYER DIED");
        if (this.sfx?.dying) this.sfx.dying.play();                                             // Play death sound
        this.player.setVisible(false);
        this.dead = true;
        this.despawnEnemies();                                                                  // Reset enemies and power ups on player death to prevent softlocking
        this.despawnPowerUps();                                                         
        this.deathCount++;                                                                      // Increment death count for end state
        this.playerControls.hasDoubleJump = false;                                              // Reset double jump so player cannot carry it from death
        this.deathEmitter1.setPosition(this.player.x, this.player.y);                           // Death Particle burst
        this.deathEmitter1.explode(50);
        this.time.delayedCall(1000, () => {                                                     // Delay reset to bring back enemies, and reset death states.
            this.spawnEnemies();
            this.spawnPowerUps();
            this.dead = false;
            this.player.setVisible(true);
            this.player.setPosition(this.spawnpointX, this.spawnpointY);
            this.player.body.setVelocity(0, 0);
        }, [], this);
    }

    // One Way Pass for collidables
    oneWayPlatformCollide(player, tile) {
        if (!tile.properties.solid) {
            return player.body.velocity.y >= 1;
        } else {
            return true;
        }
    }

    // Enemy Spawn Function
    spawnEnemies(){
        // Enemy Instantiation
        const enemySpawns = [[100, 1200], [275, 1150], [300, 1100], [300, 800], [150, 800], [700, 450]];
        this.enemies = [];

        enemySpawns.forEach(pos => {                                                            // Spawn enemies
            const [x, y] = pos;
            const enemy = new EnemyControls(this, x, y, 'onebit_tiles', this.testLayer);
            enemy.isDeadly = true;
            this.enemies.push(enemy);
        });

            this.enemies.forEach(enemyObj => {                                                  
            const enemy = enemyObj.getSprite();

            this.physics.add.collider(this.player, enemy, (player, enemy) => {                  // Handle player-enemy collisions
            const playerBottom = player.body.y + player.body.height;
            const enemyTop = enemy.body.y;

            if (player.body.velocity.y >= 0 && playerBottom <= enemyTop + 10) {                 // If touch enemy on top with downward momentum, kill enemy, play particles. Else, on contact kill the player
                this.deathEmitter1.setPosition(this.player.x, this.player.y+16);
                this.deathEmitter1.explode(50);
                enemyObj.enemy.disableBody(true, true);
                if (this.sfx?.enemykilled) this.sfx.enemykilled.play();                         // Play enemy killed sound 
                player.body.velocity.y = -200; 
            } else if(!this.dead){
                if (this.sfx?.dying) this.sfx.dying.play();                                     // Play death sound
                this.playerKill();
            }
        });
    });   
    }
    
    // Power up Spawn Function
    spawnPowerUps(){ 
        this.doubleJumpPowerUps = this.physics.add.staticGroup();                               // Spawn the power ups

        const powerUpPositions = [
            { x: 101.2, y: 624.8 },
            { x: 444.6, y: 512.8 },
            { x: 87.3, y: 407 },
            { x: 163.3, y: 486.3 },
            { x: 369, y: 236.3 }
        ];

        powerUpPositions.forEach(pos => {
            const powerUp = this.doubleJumpPowerUps.create(pos.x, pos.y, 'onebit_tiles', 62);
            powerUp.anims.play('doubleJumpPowerUp');
            powerUp.setSize(16, 16);
            powerUp.setOffset(0, 0);
            powerUp.setDepth(10);
            powerUp.refreshBody();  
        });

        this.physics.add.overlap(this.player, this.doubleJumpPowerUps, (_, powerUp) => {    // Handle power up collision handling
            this.playerControls.hasDoubleJump = true;
            if (this.sfx?.powerup) this.sfx.powerup.play();                                 // Play power up sound
            powerUp.destroy();
            this.time.delayedCall(5000, () => {                                             // On delay, refresh all the power ups by despawning and spawning them (very fast), so they respawn every 5 seconds to reset softlocking
                this.despawnPowerUps();
                this.spawnPowerUps();
        }, [], this)
        }, null, this)
    }

    // Enemy Despawn Function
    despawnEnemies() {
        // Despawn enemies
        this.enemies.forEach(enemyObj => {
            if (enemyObj && enemyObj.enemy) {
                enemyObj.enemy.destroy(); 
            }
        });
        this.enemies = []; 
    }

    // Power up Despawn function
    despawnPowerUps(){
        // Despawn power-ups
        if (this.doubleJumpPowerUps) {
            this.doubleJumpPowerUps.getChildren().forEach(powerUp => {
                powerUp.destroy(); 
            });
            this.doubleJumpPowerUps.clear(true, true); 
        }
    }

    // Update Function
    update() {
        if(this.started && !this.ended){                                                            // If game started
        this.isTouchingSign = false;                          

        this.physics.world.overlap(this.player, this.signs, this.showDialogueText, null, this);

        if (!this.isTouchingSign) {                                                                 // Sign collision handling, if overlapping a sign make the text visible, else make it not visible
            this.dialogueBox.setVisible(false);
            this.box.setVisible(false);
        }

        if(!this.dead && !this.paused){                                                             // if not dead and not paused, update player controls and enemy instances (Player movement toggle)
            this.playerControls.update();
            this.enemies.forEach(enemy => {
            enemy.update();
        });
        }

        if(this.paused){                                                                            // If paused, display the menu and freeze everything. Allow the player to restart the level on R press
            this.dialogueBox.setText('PAUSE MENU\nPRESS R: RESTART\nPRESS P: UNPAUSE');
            this.dialogueBox.setVisible(true);
            this.dialogueBorderUpdate();
            this.box.setVisible(true);
            this.enemies.forEach(enemy => {
            enemy.enemy.body.setVelocity(0, 0);
            });
            this.player.body.velocity.y = -25;
            this.player.body.velocity.x = 0;
            this.player.body.acceleration.set(0);
            if(Phaser.Input.Keyboard.JustDown(this.pKey)){
                this.paused = false;
                this.enemies.forEach(enemy => {
                enemy.enemy.body.setVelocity(100, 0);
            });
            }
            if(Phaser.Input.Keyboard.JustDown(this.rKey)){
                this.scene.restart();
            }
        } else {                                                                                    // else (if the game is not paused) pause the game.
            if(Phaser.Input.Keyboard.JustDown(this.pKey)){
            this.paused = true;

                }
            }
        } else if(!this.started){                                                                   // else if (the game isn't started) IF the player presses the S key, start the game and destroy all of the menu text
            if(Phaser.Input.Keyboard.JustDown(this.sKey)){
                this.started = true;                                                                // start tracking time for time to complete stat at the end of the game
                this.startTime = this.time.now
                this.player.setVisible(true);
        this.startTexts.forEach(textObj => {
            textObj.destroy();
        });
            }
        } else if (this.ended){                                                                     // else if (the game has ended) Freeze the player, stop any possible particle emissions, and display the end text including final time and deaths. Allow player to restart on R press.
            if (!this.victorySoundPlayed && this.sfx?.victory) {
                this.sfx.victory.play();
                this.victorySoundPlayed = true;
            }                                                                                   // Play victory sound
            this.player.body.velocity.x = 0;
            this.player.body.acceleration.set(0);
            this.player.anims.play('idle');
            if (this.sfx?.move && this.sfx.move.isPlaying) {
                this.sfx.move.stop();
            }                                                                                   // Stop the player walking sound if it is playing
            this.playerControls.walkingEmitter1.stop();
            this.playerControls.walkingEmitter2.stop();
            this.endText = this.add.bitmapText(20, 20, 'pixelfont', 'YOU HAVE REACHED THE TOP!', 15);
            this.endTextTwo = this.add.bitmapText(20, 35, 'pixelfont', `FINAL TIME: ${this.finalTime.toFixed(2)} SECONDS`, 10);
            this.endTextThree = this.add.bitmapText(20, 45, 'pixelfont', 'DEATHS: ' + this.deathCount, 10);
            this.endTextFour = this.add.bitmapText(20, 55, 'pixelfont', 'PRESS R TO RESTART', 10);
            if(Phaser.Input.Keyboard.JustDown(this.rKey)){
                this.scene.restart();
            }
        }
    }
}
