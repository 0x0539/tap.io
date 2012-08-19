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

var terrainVariation = 20;

// generate the terrain
game.state.terrain = [];
for(var i = 0; i < 50; i++){
  game.state.terrain.push([]);
  for(var j = 0; j < 50; j++){
    // eventually make this impassable
    if(i == 0 || j == 0 || i == 49 || j == 49){
      game.state.terrain[i].push(0);
    }
    else{
      var choice = Math.random(),
          avg = Math.round((game.state.terrain[i-1][j] + game.state.terrain[i][j-1]) / 2);
      if(choice < .6)
        game.state.terrain[i].push(avg);
      else if(choice < .8)
        game.state.terrain[i].push(avg + terrainVariation);
      else
        game.state.terrain[i].push(avg - terrainVariation);
    }
  }
}

game.start();
