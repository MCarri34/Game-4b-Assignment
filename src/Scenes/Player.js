//done 
export class PlayerControls {
    constructor(scene, cursors) {
    // Basic variables for playermovement, some of these aren't utilized yet since they're going to be used for particle systems that don't exist yet.
        this.scene = scene;
        this.cursors = cursors;
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.hasDoubleJump = false;                                                                     // Player starts without power-up
        this.JUMP_VELOCITY = -400;
        this.ACCELERATION = 300;
        this.DRAG = 1500;                                           
        this.JUMPCOUNT = 0;                                                                             // Regular Jump Tracker
        this.burst = 150;                                                                               // Double jump velocity constant value
        this.justBurst = false;                                                                         // Double jump tracker
        this.disableDrag = false;                                                                       // Allow for constant movement in the air without player intervention
        this.lastStepTime = 0;                                         
        this.stepCooldown = 20; 
        this.player = scene.physics.add.sprite(                                                         // Player character instantiation
            scene.game.config.width / 19,
            scene.game.config.height / 1.4,
            "platformer_characters"
        );
        this.player.setCollideWorldBounds(true)
        this.player.setDragX(this.DRAG);
        this.scene.physics.world.gravity.y = 1500;
        this.isWallSliding = false;                                                                     // Variable for Wall jumping

        //Particle Emitters
        this.scene.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 2, 2).generateTexture('whitePixel', 2, 2);
        this.walkingEmitter1 = this.scene.add.particles(this.player.x, this.player.y, 'whitePixel', {
            lifespan: { min: 200, max: 1000 },                                                          // Cone emitter for walking in direction one
            speed: { min: 30, max: 100 },                
            scale: { start: 2, end: 0 },
            quantity: 1,
            frequency: 50,
            alpha: { start: 0.7, end: 0 },
            tint: 0x666666,
            angle: { min: 160, max: 200 },
            blendMode: Phaser.BlendModes.NORMAL
        });
        this.walkingEmitter2 = this.scene.add.particles(this.player.x, this.player.y, 'whitePixel', {
            lifespan: { min: 200, max: 1000 },                                                          // Cone emitter for walking in direction two
            speed: { min: 30, max: 100 },                                                               // Two emitters because I couldn't get changing angles to work specifically for walking
            scale: { start: 2, end: 0 },
            quantity: 1,
            frequency: 50,
            alpha: { start: 0.7, end: 0 },
            tint: 0x666666,
            angle: { min: 340, max: 380 },
            blendMode: Phaser.BlendModes.NORMAL
        });
        this.wallSlideEmitter1 = this.scene.add.particles(this.player.x, this.player.y, 'whitePixel', {
            lifespan: { min: 200, max: 1000 },                                                          // Cone emitter for walking in direction two
            speed: { min: 30, max: 100 },                
            scale: { start: 1, end: 0 },
            quantity: 5,
            frequency: 50,
            alpha: { start: 0.7, end: 0 },
            tint: 0x666666,
            angle: { min: 250, max: 290 },
            blendMode: Phaser.BlendModes.NORMAL
        });
        this.jumpEmitter1 = this.scene.add.particles(this.player.x, this.player.y, 'whitePixel', {
            lifespan: { min: 200, max: 1000 },                                                          // Jump emitter for jumping, also used in Platformer.js for death particles (Particle count is just increased)
            speed: { min: 50, max: 1 },                    
            gravityY: 0,                            
            scale: { start: 2, end: 0 },             
            quantity: 10,                            
            frequency: -1,                           
            alpha: { start: 1, end: 0 },
            tint: 0x999999,
            blendMode: Phaser.BlendModes.NORMAL
        });
    }

    // Get Sprite for Platformer.js
    getSprite() {
        return this.player;
    }

    // Set sound refrences from Platformer.js
    setSounds(sfx){
        this.sfx = sfx;                                                                                 // Set sound effects for player controls
    }

    // Update Function
    update() {
        const p = this.player;
        if (!p.body.blocked.down && this.sfx?.move?.isPlaying && !this.isWallSliding) {                 // If player is not touching the ground and is not wall sliding, stop the walking sound effect
        this.sfx.move.stop();
        }
        const emitter1 = this.walkingEmitter1;
        const emitter2 = this.walkingEmitter2;
        const emitter3 = this.wallSlideEmitter1;
        const emitter4 = this.jumpEmitter1
        emitter1.setPosition(p.body.x+3, p.body.y+16);
        emitter2.setPosition(p.body.x+13, p.body.y+16);

    // Wall Contact Tracking
        if (!p.body.blocked.down && this.scene.isTouchingWall) {
            this.isWallSliding = true;                                                                  // If the player is not touching the ground and is currently touching a wall, set wall sliding tracker to true
            if(this.sfx?.move && !this.sfx.move.isPlaying){
                this.sfx.move.stop;
            }
            if (p.body.blocked.left || p.body.touching.left || p.body.wasTouching.left) {               // track what side of the player character is in contact with the wall, this is used for the actual jump which boosts the player by this.burst away from the wall.
                this.lastWallSide = 'left';
            } else if (p.body.blocked.right || p.body.touching.right || p.body.wasTouching.right) {
                this.lastWallSide = 'right';
            }
            if (p.body.velocity.y > 100) {                                                              // Simulate sliding by lowering the speed of player fall when sliding.
                p.setVelocityY(100); 
            }

            if(this.lastWallSide == 'left' && this.isWallSliding == true){
                emitter3.setPosition(p.body.x+3, p.body.y+16);
                emitter3.start();
            }
            if(this.lastWallSide == 'right' && this.isWallSliding == true){
                emitter3.setPosition(p.body.x+13, p.body.y+16);
                emitter3.start();
            }
        } else {
            this.isWallSliding = false;
            emitter3.stop();                                                                            // If player not in contact with wall or on the ground, reset the tracker.
        }
    // Max falling velocity so player doesn't clip through the ground (This is the necessary appraoch for one way pass through collision to work smoothly. TILE_BIAS makes it jittery).
        if (p.body.velocity.y > 800) {
            p.setVelocityY(800);
        }
    // Regular Player movement [Left, Right]
        if (p.body.blocked.down) {
            if (this.cursors.left.isDown) {
                if(this.sfx?.move && !this.sfx.move.isPlaying){
                    this.sfx.move.play({ loop: true });                                                 // Play walking sound effect
                }
                if (p.body.velocity.x > 0) {
                    p.setVelocityX(0);
                }
                emitter1.stop();                                                                        // start walking particles when walking
                emitter2.start();
                p.setAccelerationX(-this.ACCELERATION);
                p.setFlip(true, false);
                p.anims.play('walk', true);
                if (p.body.velocity.x < -250) {
                    p.setVelocityX(-250);
                }
            } else if (this.cursors.right.isDown) {
                if(this.sfx?.move && !this.sfx.move.isPlaying){
                    this.sfx.move.play({ loop: true });                                                 // Play walking sound effect
                }
                if (p.body.velocity.x < 0) {
                    p.setVelocityX(0);
                }
                emitter2.stop()                                                                         // start walking particles when walking
                emitter1.start();
                p.setAccelerationX(this.ACCELERATION);
                p.resetFlip();
                p.anims.play('walk', true);
                if (p.body.velocity.x > 250) {
                    p.setVelocityX(250);
                }
            } else {
                emitter1.stop();                                                                        // stop walking particles when not moving or in the air
                emitter2.stop();
                p.setAccelerationX(0);
                if (this.sfx?.move && this.sfx.move.isPlaying) {
                    this.sfx.move.stop();                                                               // Stop walking sound effect when not moving
                }
                p.anims.play('idle', true);
            }
        this.scene.isTouchingWall = false;              
        } else {
            emitter1.stop();                                                                            // stop walking particles when not moving or in the air
            emitter2.stop();
            p.setAccelerationX(0);
        }
    // Player Jumping
        if (p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT < 1) {
            p.setVelocityY(this.JUMP_VELOCITY);                                                         // First spacebar press, boost player up by JUMP_VELOCITY
            if (this.sfx?.jump) this.sfx.jump.play();                                                   // Play jump sound effect
            this.JUMPCOUNT += 1;
            emitter4.setAngle(240, 300);                                                                // Rotate it for randomness, it looks cool, different particle burst every jump
            emitter4.setPosition(p.body.x+8, p.body.y+16);
            this.jumpEmitter1.explode(20);
        }
    // Player Wall Jumping
        if (this.isWallSliding && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            p.setVelocityY(this.JUMP_VELOCITY);                                                         // On spacebar press when sliding, boost player up by JUMP_VELOCITY
            if (this.sfx?.walljump) this.sfx.walljump.play();                                           // Play wall jump sound effect
            if (this.lastWallSide === 'left') {
                p.setVelocityX(this.burst);
                emitter4.setAngle(240, 300);                                                            // Rotate it for randomness, it looks cool, different particle burst every jump
                emitter4.setPosition(p.body.x+8, p.body.y+16);
                this.jumpEmitter1.explode(20);                                                          // Additionally, based on tracking from above, launch the player away from the wall at a constant rate of this.burst
            } else if (this.lastWallSide === 'right') {
                p.setVelocityX(-this.burst);
                emitter4.setAngle(240, 300);                                                            // Rotate it for randomness, it looks cool, different particle burst every jump
                emitter4.setPosition(p.body.x+8, p.body.y+16);
                this.jumpEmitter1.explode(20);
            }
            this.isWallSliding = false;                                                                 // Reset wall jumping trackers
            this.scene.isTouchingWall = false;
        }
        if (this.isWallSliding && this.cursors.left.isDown && this.lastWallSide === 'right') {          // detach from wall without jumping functionality                                         
            p.setVelocityX(-30);                                                                        // if sliding and pressed left / right and touching corresponding wall, detach player by setting a constant velocity of 30 momentarily, reset trackerrs/flags
            this.isWallSliding = false;                                                                 
            this.scene.isTouchingWall = false;
        }
        if (this.isWallSliding && this.cursors.right.isDown && this.lastWallSide === 'left') {                                                     
            p.setVelocityX(30); 
            this.isWallSliding = false;                                                                 
            this.scene.isTouchingWall = false;
        }
    // Player Double Jump
        if (this.hasDoubleJump && !p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT === 1) {
            p.setVelocityY(this.JUMP_VELOCITY);                                                         // On second spacebar press (when not touching a wall) boost the player up by JUMP_VELOCITY again
            if (this.sfx?.doublejump) this.sfx.doublejump.play();                                       // Play double jump sound effect
            if (!this.justBurst) {
                if (this.cursors.left.isDown) {                                                         // If player presses a cursor button LEFT or RIGHT before this, send them in that direction, else the movement will stay constant from before the double jump.
                    p.setVelocityX(p.body.velocity.x);
                } else if (this.cursors.right.isDown) {
                    p.setVelocityX(p.body.velocity.x);
                }
            }
            emitter4.setAngle(240, 300);                                                                // Rotate it for randomness, it looks cool, different particle burst every jump
            emitter4.setPosition(p.body.x+8, p.body.y+16);
            this.jumpEmitter1.explode(20);

            this.JUMPCOUNT += 1;                                                                        // Increment counters to make sure jumps are finite, disable the drag for constant momentum.
            this.justBurst = true;

            this.hasDoubleJump = false; // Use up the double jump power-up
            console.log("Double jump consumed!");
            
            this.disableDrag = true;
        }
    // Play the jump animation if not touching the ground
        if (!p.body.blocked.down) {
            p.anims.play('jump', true);
        }
    // Reset counters on contact with the ground for jumps.
        if (p.body.blocked.down) {
            if (this.JUMPCOUNT === 2) {                                                                 // Re-enable drag, reset jump count, and reset double jump flag if the player performed double jump and touching the floor
                this.disableDrag = false;
                this.JUMPCOUNT = 0;
                this.justBurst = false;
            }
            if (this.JUMPCOUNT !== 0 && !this.spaceKey.isDown) {                                        // if player jumped at all, reset jump flag the minute they touch the ground and let go of space
                this.JUMPCOUNT = 0;                                                                     // both these conditions are necessary to keep the player from flying away
            }
        }
        if (p.body.blocked.down) {                                                                      // drag handling
            if (!this.disableDrag) {
                p.setDragX(this.DRAG);
            } else {
                p.setDragX(0);
            }
        } else {
            p.setDragX(0);
        }
    }
}
   