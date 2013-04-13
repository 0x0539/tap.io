/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Face3 = (function(){

  var Cache = (window || require('./cache.js')).Cache,
      Vector3 = (window || require('./vector3.js')).Vector3,
      Plane = (window || require('./plane.js')).Plane,
      Serializer = (window || require('../serializer.js')).Serializer,
      cache = new Cache(),
      id = 0,
      protokey;

  var Face3 = function(a, b, c, geometry){
    this.protokey = protokey;
    this.type = 'Face3';
    this.a = a;
    this.b = b;
    this.c = c;
    this.id = id++;
  };

  protokey = Serializer.register(Face3.prototype);

  Face3.prototype.vertices = function(geometry){
    var face = this;
    return cache.get(this.id, 'vertices', function(){
      return [
        geometry.vertices[face.a],
        geometry.vertices[face.b],
        geometry.vertices[face.c]
      ];
    });
  };

  Face3.prototype.normal = function(geometry){
    var face = this;
    return cache.get(this.id, 'normal', function(){
      var v = face.vertices(geometry),
          ab = v[1].minus(v[0]),
          ac = v[2].minus(v[0]);
      return ab.cross(ac);
    });
  };

  Face3.prototype.plane = function(geometry){
    var face = this;
    return cache.get(this.id, 'plane', function(){
      var n = face.normal(geometry),
          p = face.vertices(geometry)[0];
      return new Plane(n, p);
    });
  };

  return Face3;

})();
