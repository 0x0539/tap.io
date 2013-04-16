/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Cache = (function(){

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

  return Cache;

})();
