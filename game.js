var Engine = require('./engine.js').Engine;

exports.Game = function(network){
  var dis = this;

  // game data, should be flat js objects
  this.data = {};
  this.data.vt = 0;
  this.data.events = [];
  this.data.sessionIds = [0];

  // actual vt
  this.vt = 0;

  // get network instance and bind to events
  this.network = network;

  // when a connect is caught
  this.network.on('connect', function(sessionId){
    // send game data to the client
    dis.network.send(sessionId, 'gamedata', dis.data); 
    dis.fire('connect', {sessionId: sessionId}, 0);
  });

  // when a disconnect is caught
  this.network.on('disconnect', function(sessionId){
    dis.fire('disconnect', {sessionId: sessionId}, 0);
  });

  // when a gamevent is received
  this.network.on('gameevent', function(event, senderSessionId){
    dis.fire('gameevent', event, senderSessionId);
  });

  // game loop!
  this.gameLoopInterval = setInterval(function(){ dis.loop(); }, 1000);
};

exports.Game.prototype.loop = function(){
  this.vt++;
  Engine.safelyAdvance(this.data);
  if(this.vt % 5 == 0)
    this.fire('gameevent', 'heartbeat', 0);
};

exports.Game.prototype.fire = function(type, data, senderSessionId){
  if(type == null || data == null || senderSessionId == null)
    throw new Exception('fire requires a type, data, and a session id argument');
  var event = {
    type: type, 
    data: data, 
    vt: this.vt, 
    senderSessionId: senderSessionId
  };
  this.data.events.push(event);
  this.network.broadcast(type, event);
};
