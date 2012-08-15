/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

// import parameters in cross-platform way
var Parameters = typeof window == 'undefined' ? require('./parameters.js').Parameters : exports.Parameters;

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

exports.Utilities = Utilities;
