var modules = {};
modules.network = require('./network.js');
modules.game = require('./game.js');
modules.engine = require('./engine.js');

var network = new modules.network.Network(9585);
var game = new modules.game.Game(network);
