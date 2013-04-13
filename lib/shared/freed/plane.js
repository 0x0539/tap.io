/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Plane = (function(){

  var Vector3 = (window || require('./vector3.js')).Vector3,
      Serializer = (window || require('../serializer.js')).Serializer;

  var Plane = function(normal, point){
    this.protokey = protokey;
    this.type = 'Plane';
    this.normal = normal;
    this.A = normal.x;
    this.B = normal.y;
    this.C = normal.z;
    this.D = -(this.A*point.x + this.B*point.y + this.C*point.z);
  };

  var protokey = Serializer.register(Plane.prototype);

  Plane.prototype.project = function(v){
    var e = new Vector3(this.A, this.B, this.C),
        n = v.dot(e) + this.D,
        d = this.normal.dot(e),
        s = n / d;
    return v.minus(this.normal.times(s));
  };

  Plane.prototype.solveX = function(y, z){
    return (this.B*y + this.C*z + this.D)/(-this.A);
  };

  Plane.prototype.solveY = function(x, z){
    return (this.A*x + this.C*z + this.D)/(-this.B);
  };

  Plane.prototype.solveZ = function(x, y){
    return (this.A*x + this.B*y + this.D)/(-this.C);
  };

  return Plane;

})();
