/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined')
  window.exports = {};

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
    // if client disconnects, we can disregard them as we have already received all their messages
    if(event.type == 'disconnect')
      delete safeZone[event.data.sessionId];
    else
      safeZone[event.senderSessionId] = event.vt; // bump up the max vt for this session
  }

  return safeZone;
};

exports.Engine.calculateSafeAdvancePoint = function(state){

  var safeZone = this.calculateSafeZone(state),
      safeAdvancePoint = null;

  // calculate min across all safe zones
  for(var sessionId in safeZone){
    var vt = safeZone[sessionId];

    if(safeAdvancePoint == null || vt < safeAdvancePoint)
      safeAdvancePoint = vt;
  }

  return safeAdvancePoint;
};

exports.Engine.safelyAdvance = function(state){

  var safeAdvancePoint = this.calculateSafeAdvancePoint(state);

  if(safeAdvancePoint != null && safeAdvancePoint > state.vt){
    console.log('advancing from ' + state.vt + ' to ' + safeAdvancePoint);
    this.advanceTo(state, safeAdvancePoint);
  }
};

exports.Engine.spliceOut = function(array, element){
  var newArray = [];
  for(var i = 0; i < array.length; i++)
    if(array[i] != element)
      newArray.push(array[i]);
  return newArray;
};

// applies events from game.events up to the specified time
exports.Engine.advanceTo = function(state, advanceTo){

  for(; state.vt < advanceTo; state.vt++){

    for(var i = 0; i < this.plugins.length; i++)
      this.plugins[i].update(state);

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
      state.sessionIds = this.spliceOut(state.sessionIds, event.data.sessionId);
      break;
  }

  for(var i = 0; i < this.plugins.length; i++)
    this.plugins[i].handle(state, event);
};

exports.Engine.validate = function(state, event){
  if(event.data == null)
    throw new Error('event data missing');
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
