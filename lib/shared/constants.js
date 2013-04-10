/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Constants = (function(){

  var Constants = {};

  Constants.Events = {};
  Constants.Events.GAME_EVENT = 'GameEvent';
  Constants.Events.NEW_CONNECTION = 'ConnectEvent';
  Constants.Events.CONNECTION_LOST = 'DisconnectEvent';
  Constants.Events.EMPTY = 'EmptyEvent';
  Constants.Events.PING = 'PingEvent';
  Constants.Events.PONG = 'PongEvent';
  Constants.Events.BOOTSTRAP = 'Bootstrap';

  return Constants;

})();
