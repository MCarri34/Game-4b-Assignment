"use strict"
import { Load } from './Scenes/Load.js';
import { Platformer } from './Scenes/Platformer.js';
// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  
    },
    backgroundColor: "#00000",           
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                x: 0,
                y: 0
            },
            debug: false,
        }
    },
    width: 950,                         // Screen size adjusted to the size of the level and screen frame
    height: 900,
    scene: [Load, Platformer]
}

var cursors;
var my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);

