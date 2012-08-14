var modules = {};

// load modules
modules.network = require('./network.js');
modules.game = require('./game.js');
modules.engine = require('./engine.js');
modules.minecraft = require('./minecraft-engine.js');

// plug in minecraft engine
modules.engine.plugins.push(modules.minecraft.MinecraftEngine);

// start the networking
var network = new modules.network.Network(9585);

// start the game manager
var game = new modules.game.Game(network);
