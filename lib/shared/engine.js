/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined') window.exports = {};

// import utilities in cross-platform way
var Utilities = typeof window == 'undefined' ? require('./utilities.js').Utilities : exports.Utilities;

// Engine namespace declaration
exports.Engine = {
  plugins: []
};

exports.Engine.calculateSafeZone = function(state){
  var safeZone = {};

  // initialize for all sessions that connected before this vt but have not yet disconnected
  for(var i = 0; i < state.sessionIds.length; i++)
    safeZone[state.sessionIds[i]] = state.vt;

  for(var i = 0; i < state.events.length; i++){
    var event = state.events[i];
    switch(event.type){
      case 'disconnect':
        delete safeZone[event.data.sessionId];
        break;
      case 'connect':
        safeZone[event.data.sessionId] = event.vt;
        break;
      default:
        safeZone[event.senderSessionId] = event.vt;
        break;
    }
  }

  return safeZone;
};

exports.Engine.calculateSafeAdvancePoint = function(safeZone){

  var safeAdvancePoint = null;

  // calculate min across all safe zones
  for(var sessionId in safeZone){
    var vt = safeZone[sessionId];

    if(safeAdvancePoint == null || vt < safeAdvancePoint)
      safeAdvancePoint = vt;
  }

  return safeAdvancePoint;
};

exports.Engine.safelyAdvance = function(state){

  var safeZone = this.calculateSafeZone(state),
      safeAdvancePoint = this.calculateSafeAdvancePoint(safeZone);

  if(safeAdvancePoint != null && safeAdvancePoint > state.vt)
    this.advanceTo(state, safeAdvancePoint);

};

// applies events from game.events up to the specified time
exports.Engine.advanceTo = function(state, endVt){

  for(; state.vt < endVt; state.vt++){

    for(var i = 0; i < this.plugins.length; i++)
      this.plugins[i].update(state);

    if(state.events.length)
      while(state.events[0].vt == state.vt)
        this.handle(state, state.events.shift());
  }
};

exports.Engine.handle = function(state, event){
  try{
    this.validate(state, event);
  }catch(error){
    console.log(error.toString());
    console.log(event);
    return;
  }

  switch(event.type){
    case 'connect':
      state.sessionIds.push(event.data.sessionId);
      state.sessionIds.sort();
      break;
    case 'disconnect':
      state.sessionIds = Utilities.spliceOut(state.sessionIds, event.data.sessionId);
      break;
  }

  for(var i = 0; i < this.plugins.length; i++)
    this.plugins[i].handle(state, event);
};

exports.Engine.validate = function(state, event){
  if(event.vt == null)
    throw new Error('event vt missing');
  if(event.senderSessionId == null)
    throw new Error('sender session id missing');
  switch(event.type){
    case 'disconnect':
    case 'connect':
      if(event.senderSessionId != 0)
        throw new Error('connect/disconnect sent with session id ' + event.senderSessionId);
      if(event.data.sessionId == null)
        throw new Error('connect/disconnect sent without data.sessionId');
      if(event.data.sessionId == 0)
        throw new Error('connect/disconnect sent for server?');
      break;
    case 'gameevent':
      switch(event.data.type){
        case 'keyup':
          if(event.data.which == null)
            throw new Error("got a bad keyup event: " + event.data.which);
          break;
        default:
          throw new Error('unknown gameevent type ' + event.data.type);
      }
      break;
    case 'heartbeat':
      break;
    default:
      throw new Error('invalid event type');
  }
};
