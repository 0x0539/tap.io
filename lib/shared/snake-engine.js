/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

exports.SnakeEngine = (function(){

  var SnakeEngine = {};

  SnakeEngine.update = function(state){
    for(var sessionId in state.players){
      var player = state.players[sessionId];
      switch(player.direction){
        case 'north':
          player.y += 1;
          break;
        case 'south':
          player.y -= 1;
          break;
        case 'east':
          player.x += 1;
          break;
        case 'west':
          player.x -= 1;
          break;
      }
    }

  };

  SnakeEngine.validate = function(state, event){
    // no validations yet
  };

  SnakeEngine.handle = function(state, event){
    switch(event.type){
      case 'startSession':
        state.players = state.players || {};
        state.players[sessionId] = {x: 0, y: 0, length: 3, direction: 'north'};
        break;
      case 'endSession':
        delete state.players[sessionId];
        break;
    }
  };

  return SnakeEngine;

})();

