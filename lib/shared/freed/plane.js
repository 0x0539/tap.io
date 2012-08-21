/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Plane = (function(){

  var Vector3 = (window || require('./vector3.js')).Vector3;

  var Plane = function(normal, point){
    return {
      type: 'Plane',
      normal: normal,
      A: normal.x,
      B: normal.y,
      C: normal.z,
      D: -(normal.x*point.x + normal.y*point.y + normal.z*point.z),
    };
  };

  Plane.project = function(plane, v){
    var e = Vector3(plane.A, plane.B, plane.C),
        n = Vector3.dot(v, e) + plane.D,
        d = Vector3.dot(plane.normal, e),
        s = n / d;
    return Vector3.sub(v, Vector3.scale(plane.normal, s));
  };

  Plane.solveX = function(plane, y, z){
    return (plane.B*y + plane.C*z + plane.D)/(-plane.A);
  };

  Plane.solveY = function(plane, x, z){
    return (plane.A*x + plane.C*z + plane.D)/(-plane.B);
  };

  Plane.solveZ = function(plane, x, y){
    return (plane.A*x + plane.B*y + plane.D)/(-plane.C);
  };

  return Plane;

})();
