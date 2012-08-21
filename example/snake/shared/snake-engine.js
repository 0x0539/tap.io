/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).SnakeEngine = (function(){

  var FREED = (window || require('../../../lib/shared/freed/freed.js')).FREED;

  var SnakeEngine = {
    speed: 2,
    radius: 10
  };

  var sameSide = function(a, b, p, x, y){
    var abx = b.x - a.x,
        aby = b.y - a.y,
        apx = p.x - a.x,
        apy = p.y - a.y,
        aqx = x - a.x,
        aqy = y - a.y,
        cp1 = abx*apy - aby*apx,
        cp2 = abx*aqy - aby*aqx;
    return cp1 * cp2 > 0;
  };

  var triangleContains = function(v, x, y){
    return sameSide(v[0], v[1], v[2], x, y) &&
           sameSide(v[1], v[2], v[0], x, y) &&
           sameSide(v[2], v[0], v[1], x, y);
  };

  SnakeEngine.buildNewPlayer = function(){
    var player = {
      direction: 'east',
      segments: []
    };

    for(var y = 3; y > 0; y--){
      var center = FREED.Vector3(30*y, 30, 0),
          sphere = FREED.Sphere(center, this.radius);

      player.segments.push({
        sphere: sphere, 
        path: []
      });
    }

    return player;
  };

  SnakeEngine.update = function(state){

    // calculate face bucket for the terrain, which is static so we only do it once
    if(this.faceBucket == null)
      this.faceBucket = new FREED.FaceBucket(20, 20, state.terrain);
    if(this.xyPlane == null)
      this.xyPlane = FREED.Plane(FREED.Vector3(0, 0, 1), FREED.Vector3(0, 0, 0));

    for(var sessionId in state.players){
      var player = state.players[sessionId];
      for(var i = 0; i < player.segments.length; i++){
        var segment = player.segments[i],
            center = segment.sphere.center,
            path = segment.path;

        // remove from path if already there
        while(path.length && FREED.Vector3.equals(center, path[0]))
          path.shift();

        // if we still have a destination, move to it
        if(path.length){
          var next = path[0],
              delta = FREED.Vector3.sub(next, center);

          delta.x = Math.max(-this.speed, Math.min(this.speed, delta.x));
          delta.y = Math.max(-this.speed, Math.min(this.speed, delta.y));

          FREED.Vector3.addSelf(center, delta);
        }

        // otherwise, just go in the player direction
        else{
          switch(player.direction){
            case 'north':
              center.y += this.speed;
              break;
            case 'south':
              center.y -= this.speed;
              break;
            case 'east':
              center.x += this.speed;
              break;
            case 'west':
              center.x -= this.speed;
              break;
          }
        }

        // collision detection
        var maxZ = null, 
            cps = FREED.Sphere.getCollisionPoints(segment.sphere.radius);

        for(var c = 0; c < cps.length; c++){
          var cp = cps[c],
              x = cp.x + center.x,
              y = cp.y + center.y,
              d = cp.d,
              faces = this.faceBucket.get(x, y);
          for(var f = 0; f < faces.length; f++){
            var face = faces[f];
            if(triangleContains(FREED.Face3.vertices(face, state.terrain), x, y)){
              var plane = FREED.Face3.plane(face, state.terrain),
                  sphereZ = FREED.Plane.solveZ(plane, x, y) + d;
              maxZ = maxZ == null || sphereZ > maxZ ? sphereZ : maxZ;
            }
          }
        }

        if(maxZ == null)
          center.z = 0;
        else
          center.z = maxZ;
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
        state.players[event.data.sessionId] = this.buildNewPlayer();
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
          player.segments[i].path.push(FREED.Vector3.copy(head.sphere.center));

        break;
    }
  };

  return SnakeEngine;

})();

