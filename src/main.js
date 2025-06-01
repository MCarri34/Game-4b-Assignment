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
    backgroundColor: "#00000",           // black, maybe change if you want, probably won't.
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                x: 0,
                y: 0
            },
            debug: true,
        }
    },
    width: 999,
    height: 900,
    scene: [Load, Platformer]
}

var cursors;
var my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);

