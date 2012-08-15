// server-only dependencies
var network = require('./network.js');
var game = require('./game.js');

// shared dependencies
var engine = require('../shared/engine.js');
var minecraft = require('../shared/minecraft-engine.js');

// plug in minecraft engine
engine.Engine.plugins.push(minecraft.MinecraftEngine);

// start the networking
var server = new network.Network(9585);
server.start();

// start the game manager
var game = new game.Game(server);
game.start();
