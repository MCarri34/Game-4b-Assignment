export class EnemyControls {
    // Enemy Constructor
    constructor(scene, x, y, texture, testLayer) {
        this.scene = scene;
        this.testLayer = testLayer;
        this.speed = 100;
        this.hasStarted = false;
        this.deadly = true;

        // Create the enemy sprite with physics
        this.enemy = scene.physics.add.sprite(x, y, texture);
        this.enemy.setScale(1);

        // Adjust hitboxes 
        this.enemy.body.setSize(
            (this.enemy.width / this.enemy.scaleX) * 0.7,
            (this.enemy.height / this.enemy.scaleY) * 0.7,
            true
        );

        // Set body offset to center the hitbox
        this.enemy.body.setOffset(
            (this.enemy.width - this.enemy.body.width) / 3,
            (this.enemy.height - this.enemy.body.height) / 1
        );
        
        this.enemy.setOrigin(0.5, 0.5);
        this.enemy.setCollideWorldBounds(true);
        this.enemy.setBounce(0);

        // Add collider with the ground layer
        scene.physics.add.collider(this.enemy, testLayer);


        if (!scene.anims.exists('enemyWalk')) {
            scene.anims.create({
                key: 'enemyWalk',
                frames: scene.anims.generateFrameNumbers('onebit_tiles', { start: 321, end: 322 }),
                frameRate: 6,
                repeat: -1
            });
        }
    }

    // Getsprite for platformer.js
    getSprite() {
        return this.enemy;
    }

update() {
    const e = this.enemy;
    // At start, set velocity for enemy
    if (!this.hasStarted && e.body) {
        e.setVelocityX(this.speed);
        this.hasStarted = true;
    }

    // Flip sprite based on movement direction
    e.setFlipX(e.body.velocity.x > 0);

    // Wall collision detection
    if (e.body.blocked.left || e.body.touching.left) {
        e.setVelocityX(this.speed);
    }
    else if (e.body.blocked.right || e.body.touching.right) {
        e.setVelocityX(-this.speed);
    }

    // Only check edge if enemy is touching the ground and moving horizontally
    if (e.body.blocked.down && Math.abs(e.body.velocity.x) > 0) {
        const lookAheadDistance = 16;
        const footOffset = 10;
        const aheadX = e.body.velocity.x > 0
            ? e.x + lookAheadDistance
            : e.x - lookAheadDistance;
        const aheadY = e.y + e.height / 2 + footOffset;
        const tileBelow = this.testLayer.getTileAtWorldXY(aheadX, aheadY);
        if (!tileBelow) {
            if (e.body.velocity.x > 0) {
                e.setVelocityX(-this.speed);
            } else {
                e.setVelocityX(this.speed);
            }
        }
    }
    // Animations for Enemy
        if(e.body.velocityX != 0){
            e.anims.play('enemyWalk', true);
        }
    }
}
