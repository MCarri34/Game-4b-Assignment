(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["AnimatedTiles"] = factory();
    else
        root["AnimatedTiles"] = factory();
})(window, function() {
return (function(modules) {
    var installedModules = {};

    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) {
            return installedModules[moduleId].exports;
        }
        var module = installedModules[moduleId] = {
            i: moduleId,
            l: false,
            exports: {}
        };

        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        module.l = true;

        return module.exports;
    }

    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.d = function(exports, name, getter) {
        if (!__webpack_require__.o(exports, name)) {
            Object.defineProperty(exports, name, { configurable: false, enumerable: true, get: getter });
        }
    };
    __webpack_require__.r = function(exports) {
        Object.defineProperty(exports, '__esModule', { value: true });
    };
    __webpack_require__.n = function(module) {
        var getter = module && module.__esModule ?
            function getDefault() { return module['default']; } :
            function getModuleExports() { return module; };
        __webpack_require__.d(getter, 'a', getter);
        return getter;
    };
    __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    __webpack_require__.p = "";

    return __webpack_require__(__webpack_require__.s = 0);
})
([
/* 0 */
(function(module, exports, __webpack_require__) {
"use strict";

var AnimatedTiles = function (_Phaser$Plugins$Scene) {
    function AnimatedTiles(scene, pluginManager) {
        var _this = this;

        Phaser.Plugins.ScenePlugin.call(this, scene, pluginManager);

        this.map = null;
        this.animatedTiles = [];
        this.rate = 1;
        this.active = false;
        this.activeLayer = [];
        this.followTimeScale = true;

        if (!scene.sys.settings.isBooted) {
            scene.sys.events.once('boot', this.boot, this);
        }
    }

    AnimatedTiles.prototype = Object.create(Phaser.Plugins.ScenePlugin.prototype);
    AnimatedTiles.prototype.constructor = AnimatedTiles;

    AnimatedTiles.prototype.boot = function () {
        var eventEmitter = this.systems.events;
        eventEmitter.on('postupdate', this.postUpdate, this);
        eventEmitter.on('shutdown', this.shutdown, this);
        eventEmitter.on('destroy', this.destroy, this);
    };

    AnimatedTiles.prototype.init = function (map) {
        var mapAnimData = this.getAnimatedTiles(map);
        var animatedTiles = {
            map: map,
            animatedTiles: mapAnimData,
            active: true,
            rate: 1,
            activeLayer: []
        };
        map.layers.forEach(() => animatedTiles.activeLayer.push(true));
        this.animatedTiles.push(animatedTiles);
        if (this.animatedTiles.length === 1) {
            this.active = true;
        }
    };

    AnimatedTiles.prototype.getAnimatedTiles = function (map) {
        var _this = this;
        var animatedTiles = [];

        map.tilesets.forEach(function (tileset) {
            var tileData = tileset.tileData;
            Object.keys(tileData).forEach(function (index) {
                index = parseInt(index);
                if (tileData[index].hasOwnProperty("animation")) {
                    var animatedTileData = {
                        index: index + tileset.firstgid,
                        frames: [],
                        currentFrame: 0,
                        tiles: [],
                        rate: 1
                    };
                    tileData[index].animation.forEach(function (frameData) {
                        var frame = {
                            duration: frameData.duration,
                            tileid: frameData.tileid + tileset.firstgid
                        };
                        animatedTileData.frames.push(frame);
                    });
                    animatedTileData.next = animatedTileData.frames[0].duration;

                    map.layers.forEach(function (layer) {
                        if (layer.tilemapLayer && layer.tilemapLayer.type === "StaticTilemapLayer") {
                            animatedTileData.tiles.push([]);
                            return;
                        }
                        var tiles = [];
                        layer.data.forEach(function (tileRow) {
                            tileRow.forEach(function (tile) {
                                if (!tile) return; // <------ PATCHED: ignore null tiles safely
                                if (tile.index - tileset.firstgid === index) {
                                    tiles.push(tile);
                                }
                            });
                        });
                        animatedTileData.tiles.push(tiles);
                    });
                    animatedTiles.push(animatedTileData);
                }
            });
        });

        map.layers.forEach(function (layer, layerIndex) {
            _this.activeLayer[layerIndex] = true;
        });

        return animatedTiles;
    };

    AnimatedTiles.prototype.postUpdate = function (time, delta) {
        if (!this.active) {
            return;
        }
        var globalElapsedTime = delta * this.rate * (this.followTimeScale ? this.scene.time.timeScale : 1);
        this.animatedTiles.forEach(function (mapAnimData) {
            if (!mapAnimData.active) {
                return;
            }
            var elapsedTime = globalElapsedTime * mapAnimData.rate;
            mapAnimData.animatedTiles.forEach(function (animatedTile) {
                animatedTile.next -= elapsedTime * animatedTile.rate;
                if (animatedTile.next < 0) {
                    var currentIndex = animatedTile.currentFrame;
                    var oldTileId = animatedTile.frames[currentIndex].tileid;
                    var newIndex = currentIndex + 1;
                    if (newIndex > animatedTile.frames.length - 1) {
                        newIndex = 0;
                    }
                    animatedTile.next = animatedTile.frames[newIndex].duration;
                    animatedTile.currentFrame = newIndex;

                    animatedTile.tiles.forEach(function (layer, layerIndex) {
                        if (!mapAnimData.activeLayer[layerIndex]) {
                            return;
                        }
                        layer.forEach(function (tile) {
                            if (tile) {
                                tile.index = animatedTile.frames[newIndex].tileid;
                            }
                        });
                    });
                }
            });
        });
    };

    AnimatedTiles.prototype.resume = function (layerIndex = null, mapIndex = null) {
        var scope = mapIndex === null ? this : this.animatedTiles[mapIndex];
        if (layerIndex === null) {
            scope.active = true;
        } else {
            scope.activeLayer[layerIndex] = true;
        }
    };

    AnimatedTiles.prototype.pause = function (layerIndex = null, mapIndex = null) {
        var scope = mapIndex === null ? this : this.animatedTiles[mapIndex];
        if (layerIndex === null) {
            scope.active = false;
        } else {
            scope.activeLayer[layerIndex] = false;
        }
    };

    AnimatedTiles.prototype.shutdown = function () { };
    AnimatedTiles.prototype.destroy = function () { this.shutdown(); this.scene = undefined; };

    return AnimatedTiles;
}();

AnimatedTiles.register = function (PluginManager) {
    PluginManager.register('AnimatedTiles', AnimatedTiles, 'animatedTiles');
};

module.exports = AnimatedTiles;
})
]);
});