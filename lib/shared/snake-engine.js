/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

exports.SnakeEngine = (function(){

  var buildNewPlayer = function(){
    var player = {};
    player.direction = 'south';
    player.segments = [];
    for(var y = 0; y < 3; y++)
      player.segments.push({x: 0, y: y*30, path: []});
    return player;
  };

  var speed = 2;

  var SnakeEngine = {};

  SnakeEngine.update = function(state){
    for(var sessionId in state.players){
      var player = state.players[sessionId];
      for(var i = 0; i < player.segments.length; i++){
        var segment = player.segments[i];

        // remove from path if already there
        while(segment.path.length && segment.x == segment.path[0].x && segment.y == segment.path[0].y)
          segment.path.shift();

        // if we still have a destination, move to it
        if(segment.path.length){
          var dx = segment.path[0].x - segment.x,
              dy = segment.path[0].y - segment.y;

          if(dx > 0) dx = Math.min(speed, dx);
          if(dx < 0) dx = Math.max(-speed, dx);
          if(dy > 0) dy = Math.min(speed, dy);
          if(dy < 0) dy = Math.max(-speed, dy);

          segment.x += dx;
          segment.y += dy;
        }

        // otherwise, just go in the player direction
        else{
          switch(player.direction){
            case 'north':
              segment.y += speed;
              break;
            case 'south':
              segment.y -= speed;
              break;
            case 'east':
              segment.x += speed;
              break;
            case 'west':
              segment.x -= speed;
              break;
          }
        }
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
        state.players[event.data.sessionId] = buildNewPlayer();
        break;
      case 'endSession':
        delete state.players[event.data.sessionId];
        break;
      case 'gameevent':
        var player = state.players[event.senderSessionId],
            head = player.segments[0];

        // change player direction
        switch(event.data.type){
          case 'keyWest':
            if(player.direction != 'west' && player.direction != 'east')
              player.direction = 'west';
            break;
          case 'keyEast':
            if(player.direction != 'west' && player.direction != 'east')
              player.direction = 'east';
            break;
          case 'keySouth':
            if(player.direction != 'north' && player.direction != 'south')
              player.direction = 'south';
            break;
          case 'keyNorth':
            if(player.direction != 'north' && player.direction != 'south')
              player.direction = 'north';
            break;
        }

        // save head location in segment paths
        for(var i = 1; i < player.segments.length; i++)
          player.segments[i].path.push({x: head.x, y: head.y});

        break;
    }
  };

  return SnakeEngine;

})();

