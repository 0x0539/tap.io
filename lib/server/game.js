var Game = function(network){
  var dis = this;

  // grab an engine
  this.Engine = require('../shared/engine.js').Engine;

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
    dis.fire('connect', 0, {sessionId: sessionId});
    // send game data to the client, including the connect event
    dis.network.send(sessionId, 'gamedata', dis.state); 
  });

  // when a disconnect is caught
  this.network.on('disconnect', function(sessionId){
    dis.fire('disconnect', 0, {sessionId: sessionId});
  });

  // when a gamevent is received
  this.network.on('gameevent', function(senderSessionId, event){
    dis.fire('gameevent', senderSessionId, event);
  });

  this.network.on('heartbeat', function(senderSessionId){
    dis.fire('heartbeat', senderSessionId);
  });
};

Game.prototype.start = function(){
  if(this.gameLoopInterval != null)
    throw new Error('tried to start game loop interval twice?');

  if(this.heartbeatInterval != null)
    throw new Error('tried to start heart beat interval twice?');

  var dis = this;

  // loopy just thinking about it
  this.gameLoopInterval = setInterval(function(){ 
    dis.loop(); 
  }, 1000);

  // dont be still, my beating heart
  this.heartbeatInterval = setInterval(function(){ 
    dis.fire('heartbeat', 0); 
  }, 10000);
};

Game.prototype.loop = function(){
  this.clock++;
  this.Engine.safelyAdvance(this.state);
};

Game.prototype.fire = function(type, senderSessionId, data){
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

exports.Game = Game;
