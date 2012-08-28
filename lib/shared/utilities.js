/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Utilities = (function(){

  // import parameters in cross-platform way
  var Parameters = (window || require('./parameters.js')).Parameters;

  // Xutils namespace declaration
  var Utilities = {};

  // handy array spliceOut function
  Utilities.spliceOut = function(array, element){
    var newArray = [];
    for(var i = 0; i < array.length; i++)
      if(array[i] != element)
        newArray.push(array[i]);
    return newArray;
  };

  Utilities.spliceIndex = function(array, index){
    var newArray = [];
    for(var i = 0; i < array.length; i++)
      if(i != index)
        newArray.push(array[i]);
    return newArray;
  };

  Utilities.select = function(array, lambda){
    var newArray = [];
    for(var i = 0; i < array.length; i++)
      if(lambda(array[i], i))
        newArray.push(array[i]);
    return newArray;
  };

  // milliseconds to vt clock ticks (roughly, for when heuristics will do)
  Utilities.ms2ticks = function(ms, ratio){
    ratio = ratio || Parameters.vtPeriodInMillis;
    return Math.ceil(ms / ratio);
  };

  // vt clock ticks to milliseconds (roughly, for when heuristics will do)
  Utilities.ticks2ms = function(ticks, ratio){
    ratio = ratio || Parameters.vtPeriodInMillis;
    return Math.ceil(ticks * ratio);
  };

  return Utilities;

})();

