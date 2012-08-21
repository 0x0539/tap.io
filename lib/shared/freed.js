/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

// compact 3d state and collision library (parameterizes 3d meshes and collisions whenever possible)
exports.FREED = (function(){

  var Vector3 = function(x, y, z){ 
    this.type = 'Vector3';
    this.x = x;
    this.y = y;
    this.z = z;
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

  var Face3 = function(a, b, c){
    this.type = 'Face3';
    this.a = a;
    this.b = b;
    this.c = c;
  };

  Face3.vertices = function(face, geometry){
    return [
      geometry.vertices[face.a],
      geometry.vertices[face.b],
      geometry.vertices[face.c]
    ];
  };

  Face3.sameSide = function(a, b, p, q){
    var ab = Vector3.sub(b, a),
        ap = Vector3.sub(p, a),
        aq = Vector3.sub(q, a),
        bp = Vector3.cross(ab, ap),
        bq = Vector3.cross(ab, aq);
    return Vector3.dot(bp, bq) > 0;
  };

  // project face and point onto plane, then determine if point is within projected shape
  Face3.bounds = function(face, geometry, plane, point){
    var v = Face3.vertices(face, geometry),
        a = Plane.project(plane, v[0]),
        b = Plane.project(plane, v[1]),
        c = Plane.project(plane, v[2]),
        p = Plane.project(plane, point);
    return Face3.sameSide(a, b, c, p) && Face3.sameSide(b, c, a, p) && Face3.sameSide(c, a, b, p);
  };

  Face3.normal = function(face, geometry){
    var v = Face3.vertices(face, geometry),
        ab = Vector3.sub(v[1], v[0]),
        ac = Vector3.sub(v[2], v[0]);
    return Vector3.cross(ab, ac);
  };

  Face3.plane = function(face, geometry){
    var n = Face3.normal(face, geometry),
        p = geometry.vertices[face.a];
    return Plane(n, p);
  };

  // serializable custom geometry, explicit vertices and faces
  var Geometry = function(){ 
    this.type = 'Geometry';
    this.vertices = [];
    this.faces = [];
  };

  // represents a sphere somewhere in the world
  var Sphere = function(center, radius){
    this.type = 'Sphere';
    this.center = center;
    this.radius = radius;
  };

  Sphere.eachCollisionPoint = function(){
    var sphere = arguments.shift(),
        callback = arguments.pop(),
        angles = arguments.shift() || 3,
        radii = arguments.shift() || 3;

    if(sphere == null || sphere.type != 'Sphere')
      throw new Error('first argument must be a sphere');

    if(typeof callback != 'function')
      throw new Error('callback function is required');

    for(var i = 0; i < radii; i++){
      var radius = i * sphere.radius / (radii - 1);
      for(var a = 0; a < angles; a++){
        var radians = a * 2 * Math.PI / (angles - 1),
            x = radius * Math.sin(radians),
            y = radius * Math.cos(radians),
            g = Math.max(0, Math.sqrt(x*x + y*y)),
            d = Math.sqrt(sphere.radius*sphere.radius - g*g);
        callback(Vector3(sphere.center.x + x, sphere.center.y + y, sphere.center.z - d);
        callback(Vector3(sphere.center.x + x, sphere.center.y + y, sphere.center.z + d);
      }
    }
  };

  var Plane = function(normal, point){
    this.normal = normal;
    this.A = normal.x;
    this.B = normal.y;
    this.C = normal.z;
    this.D = -(normal.x*point.x + normal.y*point.y + normal.z*point.z);
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

  var FaceBucket = function(cols, rows, geometry){
    if(geometry.type != 'Geometry')
      throw new Error('facebucket only works with Geometry types');

    this.cols = cols || 50;
    this.rows = rows || 50;
    this.faceData = [];
    this.l = null;
    this.t = null;
    this.r = null;
    this.b = null;

    for(var f = 0; f < geometry.faces.length; f++)
      this.add(geometry.faces[f], geometry);

    this.update();
  };

  FaceBucket.prototype.add = function(face, geometry){
    var v0 = geometry.vertices[face.a],
        v1 = geometry.vertices[face.b],
        v2 = geometry.vertices[face.c],
        f = {
          face: face,
          l: Math.min.apply(Math.min, [v0.x, v1.x, v2.x]),
          b: Math.min.apply(Math.min, [v0.y, v1.y, v2.y]),
          r: Math.max.apply(Math.max, [v0.x, v1.x, v2.x]),
          t: Math.max.apply(Math.max, [v0.y, v1.y, v2.y])
        };
    this.l = Math.min(this.l || f.l, f.l);
    this.b = Math.min(this.b || f.b, f.b);
    this.r = Math.max(this.r || f.r, f.r);
    this.t = Math.max(this.t || f.t, f.t);
    this.faceData.push(f);
  };

  FaceBucket.prototype.getX = function(x){
    return Math.floor((x - this.l) / this.w);
  };

  FaceBucket.prototype.getY = function(y){
    return Math.floor((y - this.b) / this.h);
  };

  FaceBucket.prototype.rectOverlaps = function(r1, r2){
    var lInside = r1[0] > r2[0] && r1[0] < r2[2],
        rInside = r1[2] > r2[0] && r1[2] < r2[2],
        tInside = r1[1] > r2[1] && r1[1] < r2[3],
        bInside = r1[3] > r2[1] && r1[3] < r2[3];
    return (lInside || rInside) && (tInside || bInside);
  };

  FaceBucket.prototype.rectsOverlap = function(r1, r2){
    return this.rectOverlaps(r1, r2) || this.rectOverlaps(r2, r1);
  };

  FaceBucket.prototype.update = function(){
    this.buckets = [];
    for(var i = 0; i < this.cols; i++){
      this.buckets.push([]);
      for(var j = 0; j < this.rows; j++){
        this.buckets[i].push([]);
      }
    }

    this.w = (this.r - this.l) / this.cols;
    this.h = (this.t - this.b) / this.rows;

    for(var i = 0; i < this.faceData.length; i++){
      var f = this.faceData[i];

      for(var x = 0; x < this.cols; x++){
        for(var y = 0; y < this.rows; y++){
          var l = this.l + x * this.w,
              b = this.b + y * this.h,
              r = l + this.w,
              t = b + this.h,
              r1 = [  l,   b,   r,   t],
              r2 = [f.l, f.b, f.r, f.t];

          if(this.rectsOverlap(r1, r2))
            this.buckets[x][y].push(f.face);
        }
      }
    }
  };

  FaceBucket.prototype.inBounds = function(x, y){
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  };

  FaceBucket.prototype.get = function(x, y){
    var bx = this.getX(x),
        by = this.getY(y);
    return this.inBounds(bx, by) ? this.buckets[bx][by] : [];
  };

  return {
    Vector3: Vector3,
    FaceBucket: FaceBucket,
    Face3: Face3,
    Plane: Plane,
    Geometry: Geometry,
    Sphere: Sphere
  };

})();

