/*
 * The game engine should be runnable in both the browser and node.js. The goal is to make it cross-platform
 * so that we get free test coverage and knowledge that the results will be deterministic. Unfortunately,
 * it keeps us from using jQuery and node.js extensions.
 */

// define exports namespace for clients if it does not exist
if(typeof exports == 'undefined')
  window.exports = {};

// Engine namespace declaration
exports.Engine = {};

exports.Engine.safelyAdvance = function(game){
  var safeZone = {};

  for(var i = 0; i < game.sessionIds.length; i++){
    var sessionId = game.sessionIds[i];
    safeZone[sessionId] = game.vt;
  }

  for(var i = 0; i < game.events.length; i++){
    var event = game.events[i];

    switch(event.type){
      case 'disconnect':
        safeZone[event.data.sessionId] = null;
        break;
      case 'gameevent':
        safeZone[event.senderSessionId] = event.vt;
        break;
    }
  }

  var advanceTo = null;

  for(var sessionId in safeZone){
    var vt = safeZone[sessionId];

    // null indicates user disconnected, we know we have all their messages
    if(vt == null) 
      continue;
    else if(advanceTo == null)
      advanceTo = vt;
    else if(vt <= advanceTo)
      advanceTo = vt;
  }

  if(advanceTo <= game.vt){
    console.log('not advancing');
  }
  else{
    console.log('advancing from ' + game.vt + ' to ' + advanceTo);
    this.advanceTo(game, advanceTo);
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
exports.Engine.advanceTo = function(game, advanceTo){
  var firstKeep = null;

  // advance the game, keeping track of the events we have to remove
  for(var i = 0; i < game.events.length; i++){
    var event = game.events[i];
    if(event.vt < advanceTo){
      this.advance(game, event);
    }
    else{
      firstKeep = i;
      break; // optimizing, because events are in vt order
    }
  }

  // update the vt
  game.vt = advanceTo;

  // remove all events that were applied
  game.events = firstKeep == null ? [] : game.events.splice(firstKeep);
};

exports.Engine.advance = function(game, event){
  try{
    this.validate(game, event);
  }catch(error){
    console.log(error.toString());
    console.log(event);
    return;
  }

  switch(event.type){
    case 'connect':
      game.sessionIds.push(event.data.sessionId);
      game.sessionIds.sort();
      break;
    case 'disconnect':
      game.sessionIds = this.spliceOut(game.sessionIds, event.data.sessionId);
      game.sessionIds.sort();
      break;
    case 'gameevent':
      break;
    default:
      console.log('what happened? got a game event with type ' + gameevent.type);
      break;
  }
};

exports.Engine.validate = function(game, event){
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
      break;
    default:
      throw new Error('invalid event type');
  }
};
