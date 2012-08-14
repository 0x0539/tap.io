/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

var MinecraftEngine = {};

MinecraftEngine.update = function(state){

};

MinecraftEngine.handle = function(state, event){

};

exports.MinecraftEngine = MinecraftEngine;
