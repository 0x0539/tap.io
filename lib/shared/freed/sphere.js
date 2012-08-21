/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Sphere = (function(){

  var Cache = (window || require('./cache.js')).Cache,
      cache = new Cache();

  // represents a sphere somewhere in the world
  var Sphere = function(center, radius){
    return {
      type: 'Sphere',
      center: center,
      radius: radius
    };
  };

  Sphere.getCollisionPoints = function(maxRadius, radianRes, radiusRes){
    radianRes = radianRes || 5;
    radiusRes = radiusRes || 3;

    return cache.get('Sphere', 'getCollisionPoints', maxRadius, radianRes, radiusRes, function(){

      var collisionPoints = [],
          maxRadian = 2 * Math.PI * (1 - 1/radianRes);

      // point directly below sphere
      collisionPoints.push({x: 0, y: 0, d: maxRadius});

      // start 1 point out
      for(var r = 1; r < radiusRes; r++){
        var radius = (maxRadius * r) / (radiusRes - 1);

        for(var a = 0; a < radianRes; a++){
          var radian = (maxRadian * a) / (radianRes - 1);

          var x = radius * Math.sin(radian),
              y = radius * Math.cos(radian),
              g = Math.max(0, Math.sqrt(x*x + y*y)),
              d = Math.sqrt(maxRadius*maxRadius - g*g);

          collisionPoints.push({x: x, y: y, d: d});
        }
      }

      return collisionPoints;

    });
  };

  return Sphere;

})();
