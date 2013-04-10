/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

(window || exports).Engine = (function(){

  // import utilities in cross-platform way
  var Utilities = (window || require('./utilities.js')).Utilities;
  var Events = (window || require('./constants.js')).Constants.Events;

  var Engine = {
    plugins: []
  };

  Engine.calculateSafeZone = function(state){
    var safeZone = {};

    // initialize for all sessions that connected before this vt but have not yet disconnected
    for(var i = 0; i < state.sessionIds.length; i++)
      safeZone[state.sessionIds[i]] = state.vt;

    for(var i = 0; i < state.events.length; i++){
      var event = state.events[i];
      switch(event.type){
        case Events.NEW_SESSION:
          safeZone[event.data.sessionId] = event.vt;
          break;
        case Events.END_SESSION:
          delete safeZone[event.data.sessionId];
          break;
        default:
          safeZone[event.senderSessionId] = event.vt;
          break;
      }
    }

    return safeZone;
  };

  Engine.calculateSafeAdvancePoint = function(safeZone){

    var safeAdvancePoint = null;

    // calculate min across all safe zones
    for(var sessionId in safeZone){
      var vt = safeZone[sessionId];

      if(safeAdvancePoint == null || vt < safeAdvancePoint)
        safeAdvancePoint = vt;
    }

    return safeAdvancePoint;
  };

  Engine.safelyAdvance = function(state){

    var safeZone = this.calculateSafeZone(state),
        safeAdvancePoint = this.calculateSafeAdvancePoint(safeZone);

    if(safeAdvancePoint != null && safeAdvancePoint > state.vt)
      this.advanceTo(state, safeAdvancePoint);
  };

  // applies events from game.events up to the specified time
  Engine.advanceTo = function(state, endVt){

    for(; state.vt < endVt; state.vt++){

      // handle physics at current vt
      for(var i = 0; i < this.plugins.length; i++)
        this.plugins[i].update(state);

      // handle events at current vt
      while(state.events.length > 0 && state.events[0].vt == state.vt)
        this.handle(state, state.events.shift());
    }
  };

  Engine.handle = function(state, event){
    try{
      this.validate(state, event);
    }catch(error){
      return;
    }

    switch(event.type){
      case Events.NEW_SESSION:
        state.sessionIds.push(event.data.sessionId);
        state.sessionIds.sort();
        break;
      case Events.END_SESSION:
        state.sessionIds = Utilities.spliceOut(state.sessionIds, event.data.sessionId);
        break;
    }

    for(var i = 0; i < this.plugins.length; i++)
      this.plugins[i].handle(state, event);
  };

  Engine.validate = function(state, event){

    if(event.vt == null)
      throw new Error('event vt missing or wrong type');

    if(event.senderSessionId == null)
      throw new Error('sender session id missing or wrong type');

    switch(event.type){
      case Events.END_SESSION:
      case Events.NEW_SESSION:
        if(event.senderSessionId != 0)
          throw new Error('secure message sent from insecure session ' + event.senderSessionId);

        if(event.data.sessionId == null)
          throw new Error('missing data.sessionId or wrong type');

        if(event.data.sessionId == 0)
          throw new Error('data.sessionId refers to server');

        break;
      case Events.CUSTOM:
        break;
      case Events.EMPTY:
        break;
      default:
        throw new Error('invalid event type');
    }
    for(var i = 0; i < this.plugins.length; i++)
      this.plugins[i].validate(state, event);
  };

  return Engine;

})();

