var Engine = require('./engine.js').Engine;

exports.Game = function(network){
  var dis = this;

  // game data, should be flat js objects
  this.state = {};
  this.state.vt = 0;
  this.state.events = [];
  this.state.sessionIds = [0]; // server (id=0) is always present

  // actual vt
  this.clock = 0;

  // get network instance and bind to events
  this.network = network;

  // when a connect is caught
  this.network.on('connect', function(sessionId){
    // send game data to the client
    dis.network.send(sessionId, 'gamedata', dis.data); 
    dis.fire('connect', 0, {sessionId: sessionId});
  });

  // when a disconnect is caught
  this.network.on('disconnect', function(sessionId){
    dis.fire('disconnect', 0, {sessionId: sessionId});
  });

  // when a gamevent is received
  this.network.on('gameevent', function(senderSessionId, event){
    dis.fire('gameevent', senderSessionId, event);
  });

  // game loop!
  this.gameLoopInterval = setInterval(function(){ dis.loop(); }, 1000);
  this.heartbeatInterval = setInterval(function(){ dis.fire('heartbeat', 0); }, 10000);
};

exports.Game.prototype.loop = function(){
  this.clock++;
  Engine.safelyAdvance(this.state);
};

exports.Game.prototype.fire = function(type, senderSessionId, data){
  if(type == null || senderSessionId == null)
    throw new Exception('fire requires a type and a session id');

  var event = {
    type: type, 
    data: data, 
    vt: this.clock, 
    senderSessionId: senderSessionId
  };

  this.state.events.push(event);
  this.network.broadcast(type, event);
};
