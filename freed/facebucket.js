/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).FaceBucket = (function(){

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
    this.l = this.l == null ? f.l : Math.min(this.l, f.l);
    this.b = this.b == null ? f.b : Math.min(this.b, f.b);
    this.r = this.r == null ? f.r : Math.max(this.r, f.r);
    this.t = this.t == null ? f.t : Math.max(this.t, f.t);
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

    var faces = 0;
    for(var i = 0; i < this.cols; i++){
      for(var j = 0; j < this.rows; j++){
        faces += this.buckets[i][j].length;
      }
    }
    console.log(faces / (this.cols*this.rows) + ' avg faces per bucket');
  };

  FaceBucket.prototype.inBounds = function(x, y){
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  };

  FaceBucket.prototype.get = function(x, y){
    var bx = this.getX(x),
        by = this.getY(y);
    return this.inBounds(bx, by) ? this.buckets[bx][by] : [];
  };

  return FaceBucket;

})();
