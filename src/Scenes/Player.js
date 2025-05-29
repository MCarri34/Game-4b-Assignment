//done 
export class PlayerControls {
    constructor(scene, cursors) {
    // Basic variables for playermovement, some of these aren't utilized yet since they're going to be used for particle systems that don't exist yet.
        this.scene = scene;
        this.cursors = cursors;
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
    }
    // Get Sprite for Platformer.js
    getSprite() {
        return this.player;
    }

    // Pre-Existing fadeout function for any non-particle emitting particle animations. Also might be used for player death or enemy death.
    fadeOut = (particle, duration, float) => {
        this.scene.tweens.add({
            targets: particle,
            alpha: 0,            
            y: particle.y - float,  
            duration: duration,       
            ease: 'Linear',
            onComplete: () => {
                particle.destroy(); 
            }
        });

    }

    // Update Function
    update() {
        const p = this.player;
    // Wall Contact Tracking
        if (!p.body.blocked.down && this.scene.isTouchingWall) {
            this.isWallSliding = true;                                                                  // If the player is not touching the ground and is currently touching a wall, set wall sliding tracker to true
            if (p.body.blocked.left || p.body.touching.left || p.body.wasTouching.left) {               // track what side of the player character is in contact with the wall, this is used for the actual jump which boosts the player by this.burst away from the wall.
                this.lastWallSide = 'left';
            } else if (p.body.blocked.right || p.body.touching.right || p.body.wasTouching.right) {
                this.lastWallSide = 'right';
            }
            if (p.body.velocity.y > 100) {                                                              // Simulate sliding by lowering the speed of player fall when sliding.
                p.setVelocityY(100); 
            }
        } else {
            this.isWallSliding = false;                                                                 // If player not in contact with wall or on the ground, reset the tracker.
        }
    // Max falling velocity so player doesn't clip through the ground (This is the necessary appraoch for one way pass through collision to work smoothly. TILE_BIAS makes it jittery).
        if (p.body.velocity.y > 800) {
            p.setVelocityY(800);
        }
    // Regular Player movement [Left, Right]
        if (p.body.blocked.down) {
            if (this.cursors.left.isDown) {
                if (p.body.velocity.x > 0) {
                    p.setVelocityX(0);
                }
                p.setAccelerationX(-this.ACCELERATION);
                p.setFlip(true, false);
                p.anims.play('walk', true);
                if (p.body.velocity.x < -250) {
                    p.setVelocityX(-250);
                }
            } else if (this.cursors.right.isDown) {
                if (p.body.velocity.x < 0) {
                    p.setVelocityX(0);
                }
                p.setAccelerationX(this.ACCELERATION);
                p.resetFlip();
                p.anims.play('walk', true);
                if (p.body.velocity.x > 250) {
                    p.setVelocityX(250);
                }
            } else {
                p.setAccelerationX(0);
                p.anims.play('idle', true);
            }
        this.scene.isTouchingWall = false;              
        } else {
            p.setAccelerationX(0);
        }
    // Player Jumping
        if (p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT < 1) {
            p.setVelocityY(this.JUMP_VELOCITY);                                                         // First spacebar press, boost player up by JUMP_VELOCITY
            this.JUMPCOUNT += 1;
        }
    // Player Wall Jumping
        if (this.isWallSliding && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            p.setVelocityY(this.JUMP_VELOCITY);                                                         // On spacebar press when sliding, boost player up by JUMP_VELOCITY
            if (this.lastWallSide === 'left') {
                p.setVelocityX(this.burst);                                                             // Additionally, based on tracking from above, launch the player away from the wall at a constant rate of this.burst
            } else if (this.lastWallSide === 'right') {
                p.setVelocityX(-this.burst); 
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
        if (!p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT === 1) {
            p.setVelocityY(this.JUMP_VELOCITY);                                                         // On second spacebar press (when not touching a wall) boost the player up by JUMP_VELOCITY again
            if (!this.justBurst) {
                if (this.cursors.left.isDown) {                                                         // If player presses a cursor button LEFT or RIGHT before this, send them in that direction, else the movement will stay constant from before the double jump.
                    p.setVelocityX(p.body.velocity.x);
                } else if (this.cursors.right.isDown) {
                    p.setVelocityX(p.body.velocity.x);
                }
            }
            this.JUMPCOUNT += 1;                                                                        // Increment counters to make sure jumps are finite, disable the drag for constant momentum.
            this.justBurst = true;
            this.disableDrag = true;
        }
    // Play the jump animation if not touching the ground
        if (!p.body.blocked.down) {
            p.anims.play('jump', true);
        }
    // Reset counters on contact with the ground for jumps.
        if (p.body.blocked.down) {
            if (this.JUMPCOUNT === 2) {
                p.setAngle(0);
                this.disableDrag = false;
                this.JUMPCOUNT = 0;
                this.justBurst = false;
            }
            if (this.JUMPCOUNT !== 0 && !this.spaceKey.isDown) {
                this.JUMPCOUNT = 0;
            }
        }
        if (p.body.blocked.down) {
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
    




