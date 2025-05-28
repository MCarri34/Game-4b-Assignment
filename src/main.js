// Jim Whitehead
// Created: 4/14/2024
// Phaser: 3.70.0
//
// Cubey
//
// An example of putting sprites on the screen using Phaser
// 
// Art assets from Kenny Assets "Shape Characters" set:
// https://kenney.nl/assets/shape-characters

// debug with extreme prejudice
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
    width: 1440,
    height: 900,
    scene: [Load, Platformer]
}

var cursors;
var my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);