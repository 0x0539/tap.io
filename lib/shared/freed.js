/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

// compact 3d state and collision library (parameterizes 3d meshes and collisions whenever possible)
exports.FREED = (function(){

  var Cache = function(){
    this.cache = {};
  };

  Cache.prototype.get = function(){
    if(arguments.length < 2)
      throw new Error('you must pass at least two arguments to Cache.get(keys..., function)');

    var how = arguments[arguments.length - 1];

    if(typeof how != 'function')
      throw new Error('last argument to Cache.get() must be a function');

    var cache = this.cache;

    for(var k = 0; k < arguments.length - 2; k++){
      var key = arguments[k];
      cache[key] = cache[key] || {};
      cache = cache[key];
    }

    var bottomKey = arguments[arguments.length - 2];

    return cache[bottomKey] = cache[bottomKey] || how();
  };

  var id = 0;
  var cache = new Cache();

  var Vector3 = function(x, y, z){ 
    return {
      type: 'Vector3',
      x: x,
      y: y,
      z: z
    };
  };

  Vector3.copy = function(self){
    return Vector3(self.x, self.y, self.z);
  };

  Vector3.addSelf = function(self, b){
    self.x += b.x;
    self.y += b.y;
    self.z += b.z;
    return self;
  };
  Vector3.add = function(a, b){
    return Vector3.addSelf(Vector3.copy(a), b);
  };

  Vector3.subSelf = function(self, b){
    self.x -= b.x;
    self.y -= b.y;
    self.z -= b.z;
    return self;
  };
  Vector3.sub = function(a, b){
    return Vector3.subSelf(Vector3.copy(a), b);
  };

  Vector3.scaleSelf = function(self, s){
    self.x *= s;
    self.y *= s;
    self.z *= s;
    return self;
  };
  Vector3.scale = function(v, scalar){
    return Vector3.scaleSelf(Vector3.copy(v), scalar);
  };

  Vector3.cross = function(a, b){
    return Vector3(
      a.y*b.z - a.z*b.y,
      a.z*b.x - a.x*b.z,
      a.x*b.y - a.y*b.x
    );
  };

  Vector3.equals = function(a, b){
    return a.x == b.x && a.y == b.y && a.z == b.z;
  };

  Vector3.dot = function(a, b){
    return a.x * b.x + a.y * b.y + a.z * b.z;
  };

  var Face3 = function(a, b, c, geometry){
    var face = {
      type: 'Face3',
      a: a,
      b: b,
      c: c,
      id: id++
    };
    return face;
  };

  Face3.vertices = function(face, geometry){
    return cache.get('Face3', face.id, 'vertices', function(){
      return [
        geometry.vertices[face.a],
        geometry.vertices[face.b],
        geometry.vertices[face.c]
      ];
    });
  };

  Face3.normal = function(face, geometry){
    return cache.get('Face3', face.id, 'normal', function(){
      var v = Face3.vertices(face, geometry),
          ab = Vector3.sub(v[1], v[0]),
          ac = Vector3.sub(v[2], v[0]);
      return Vector3.cross(ab, ac);
    });
  };

  Face3.plane = function(face, geometry){
    return cache.get('Face3', face.id, 'plane', function(){
      var n = Face3.normal(face, geometry),
          p = Face3.vertices(face, geometry)[0];
      return Plane(n, p);
    });
  };

  // serializable custom geometry, explicit vertices and faces
  var Geometry = function(){ 
    return {
      type: 'Geometry',
      vertices: [],
      faces: []
    };
  };

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

  return {
    Vector3: Vector3,
    Face3: Face3,
    Plane: Plane,
    Geometry: Geometry,
    Sphere: Sphere
  };

})();

