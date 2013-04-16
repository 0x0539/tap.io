/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).FREED = (function(){

  return {
    Vector3:    (window || require('./vector3.js')).Vector3,
    Face3:      (window || require('./face3.js')).Face3,
    Plane:      (window || require('./plane.js')).Plane,
    Geometry:   (window || require('./geometry.js')).Geometry,
    Cache:      (window || require('./cache.js')).Cache,
    Sphere:     (window || require('./sphere.js')).Sphere,
    FaceBucket: (window || require('./facebucket.js')).FaceBucket
  };

})();

