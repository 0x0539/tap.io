global.window = false;

// server-only dependencies
var network = require('../../../lib/server/network.js');
var game = require('../../../lib/server/game.js');

// shared dependencies
var engine = require('../../../lib/shared/engine.js'),
    FREED = require('../../../lib/shared/freed/freed.js').FREED;

var snake = require('../shared/snake-engine.js');

// plug in game engine
engine.Engine.plugins.push(snake.SnakeEngine);

// start the networking
var server = new network.Network(9585);
server.start();

// start the game manager
var game = new game.Game(server);

game.state.terrain = FREED.Geometry();

var cols = 30, rows = 30, scale = 30;
for(var i = 0; i < cols; i++){
  for(var j = 0; j < rows; j++){
    var z = scale*Math.sin(Math.sqrt(i*i + j*j));
    game.state.terrain.vertices.push(FREED.Vector3(i*scale, j*scale, z));
  }
}

for(var i = 0; i < cols - 1; i++){
  for(var j = 0; j < rows - 1; j++){
    var v = i*rows + j,
        f1 = FREED.Face3(v, v+rows+1, v+1, game.state.terrain),
        f2 = FREED.Face3(v, v+rows, v+rows+1, game.state.terrain);
    game.state.terrain.faces.push(f1);
    game.state.terrain.faces.push(f2);
  }
}

game.start();
