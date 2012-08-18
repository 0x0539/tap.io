// server-only dependencies
var network = require('../../../lib/server/network.js');
var game = require('../../../lib/server/game.js');

// shared dependencies
var engine = require('../../../lib/shared/engine.js');
var snake = require('../shared/snake-engine.js');

// plug in game engine
engine.Engine.plugins.push(snake.SnakeEngine);

// start the networking
var server = new network.Network(9585);
server.start();

// start the game manager
var game = new game.Game(server);
game.start();
