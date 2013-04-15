/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Vector3 = (function(){

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

  Vector3.distance = function(a, b){
    if(a.type != 'Vector3') throw new Error('must pass a Vector3');
    if(b.type != 'Vector3') throw new Error('must pass a Vector3');
    return Math.sqrt(
      Math.pow(b.x - a.x, 2) +
      Math.pow(b.y - a.y, 2) +
      Math.pow(b.z - a.z, 2)
    );
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

  return Vector3;

})();
