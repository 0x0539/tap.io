/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

var Parameters = {
  vtPeriodInMillis: 16, // game loop speed, works out to roughly 60 ticks per second
  eventDelayMillis: 250 // used to 'postdate' events, reducing likelihood of client projected state reset
};

exports.Parameters = Parameters;
