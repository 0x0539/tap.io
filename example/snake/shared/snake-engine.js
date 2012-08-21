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
    for(var y = 0; y < 3; y++){
      var sphere = FREED.Sphere(FREED.Vector3(0, y*30, 0), 10);
      player.segments.push({
        sphere: sphere, 
        path: []
      });
    }
    return player;
  };

  var speed = 2;

  var SnakeEngine = {};

  SnakeEngine.update = function(state){
    for(var sessionId in state.players){
      var player = state.players[sessionId];
      for(var i = 0; i < player.segments.length; i++){
        var segment = player.segments[i],
            center = segment.sphere.center,
            path = segment.path;

        // remove from path if already there
        while(path.length && FREED.Vector3.equal(center, path[0]))
          path.shift();

        // if we still have a destination, move to it
        if(path.length){
          var next = path[0],
              delta = FREED.Vector3.sub(next, center);

          delta.x = Math.min(-speed, Math.max(speed, delta.x));
          delta.y = Math.min(-speed, Math.max(speed, delta.y));
          delta.z = Math.min(-speed, Math.max(speed, delta.z));

          FREED.Vector3.addSelf(center, delta);
        }

        // otherwise, just go in the player direction
        else{
          switch(player.direction){
            case 'north':
              center.y += speed;
              break;
            case 'south':
              center.y -= speed;
              break;
            case 'east':
              center.x += speed;
              break;
            case 'west':
              center.x -= speed;
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
          player.segments[i].path.push(Vector3.copy(head.sphere.center));

        break;
    }
  };

  return SnakeEngine;

})();

