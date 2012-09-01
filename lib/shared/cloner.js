/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Cloner = (function(){

  var Serializer = (window || require('./serializer.js')).Serializer;

  var Cloner = {};

  Cloner.clone = function(object){
    return Serializer.deserialize(Serializer.serialize(object));
  };

  return Cloner;
})();
