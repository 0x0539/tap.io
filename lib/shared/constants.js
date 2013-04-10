/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Constants = (function(){

  var Constants = {};

  Constants.Events = {};

  // All custom events should use this type.
  Constants.Events.CUSTOM = 'CustomEvent';

  // Generated internally but clients may find them useful enough to pay attention to.
  Constants.Events.NEW_SESSION = 'NewSessionEvent';
  Constants.Events.END_SESSION = 'EndSessionEvent';

  // For internal use.
  Constants.Events.EMPTY = 'EmptyEvent';
  Constants.Events.PING = 'PingEvent';
  Constants.Events.PONG = 'PongEvent';
  Constants.Events.BOOTSTRAP = 'Bootstrap';

  return Constants;

})();
