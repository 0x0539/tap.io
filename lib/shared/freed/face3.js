/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Face3 = (function(){

  var Cache = (window || require('./cache.js')).Cache,
      Vector3 = (window || require('./vector3.js')).Vector3,
      Plane = (window || require('./plane.js')).Plane,
      cache = new Cache(),
      id = 0;

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
    return cache.get(face.id, 'vertices', function(){
      return [
        geometry.vertices[face.a],
        geometry.vertices[face.b],
        geometry.vertices[face.c]
      ];
    });
  };

  Face3.normal = function(face, geometry){
    return cache.get(face.id, 'normal', function(){
      var v = Face3.vertices(face, geometry),
          ab = Vector3.sub(v[1], v[0]),
          ac = Vector3.sub(v[2], v[0]);
      return Vector3.cross(ab, ac);
    });
  };

  Face3.plane = function(face, geometry){
    return cache.get(face.id, 'plane', function(){
      var n = Face3.normal(face, geometry),
          p = Face3.vertices(face, geometry)[0];
      return Plane(n, p);
    });
  };

  return Face3;

})();
