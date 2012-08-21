global.window = false;

// server-only dependencies
var Network = require('../../../lib/server/network.js').Network,
    Game = require('../../../lib/server/game.js').Game,
    Engine = require('../../../lib/shared/engine.js').Engine,
    FREED = require('../../../lib/shared/freed/freed.js').FREED,
    SnakeEngine = require('../shared/snake-engine.js').SnakeEngine;

// plug in game engine
Engine.plugins.push(SnakeEngine);

// start the networking
var server = new Network(9585);
server.start();

// start the game manager
var game = new Game(server);

game.state.terrain = FREED.Geometry();

var cols = 30, rows = 30, scale = 30;
for(var i = 0; i < cols; i++){
  for(var j = 0; j < rows; j++){
    var z1 = scale*Math.sin(Math.sqrt(i*i + j*j)),
        z2 = 2*scale*Math.sin(Math.sqrt((rows-i)*(rows-i) + j*j));
    game.state.terrain.vertices.push(FREED.Vector3(i*scale, j*scale, z1 + z2));
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
