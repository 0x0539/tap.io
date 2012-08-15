var Game = function(network, state){
  var dis = this;

  if(network == null)
    throw new Error('network is a required argument');

  this.Engine = require('../shared/engine.js').Engine;
  this.Parameters = require('../shared/parameters.js').Parameters;
  this.Utilities = require('../shared/utilities.js').Utilities;

  this.network = network;

  // game data, should be flat js objects
  this.state = state || {
    clock: 0,
    vt: 0,
    events: [],
    sessionIds: [0]
  };

  if(this.state.clock == null)
    throw new Error('state clock is missing');

  if(this.state.vt == null)
    throw new Error('state vt is missing');

  if(this.state.events == null)
    throw new Error('state events array is missing');

  if(this.state.sessionIds == null)
    throw new Error('state sessionIds array is missing');

  // disconnect all non-server users because nobody is connected right now
  for(var i = 0; i < this.state.sessionIds.length; i++){
    var sessionId = this.state.sessionIds[i];
    if(sessionId != 0){
      var event = this.buildEvent('endSession', 0, {sessionId: sessionId});
      this.state.events.push(event); // hotwire the event to the state
    }
  }

  // when a startSession is caught
  this.network.on('startSession', function(sessionId){
    dis.fire(dis.buildEvent('startSession', 0, {sessionId: sessionId}));

    // send game data to the client, including the startSession event
    dis.network.send(sessionId, 'bootstrap', {state: dis.state, sessionId: sessionId}); 
  });

  // when a endSession is caught
  this.network.on('endSession', function(sessionId){
    dis.fire(dis.buildEvent('endSession', 0, {sessionId: sessionId}));
  });

  // when a gamevent is received
  this.network.on('gameevent', function(senderSessionId, event){
    dis.fire(dis.buildEvent('gameevent', senderSessionId, event));
  });

  this.network.on('heartbeat', function(senderSessionId){
    dis.fire(dis.buildEvent('heartbeat', senderSessionId));
  });
};

Game.prototype.start = function(){
  if(this.gameLoopInterval != null)
    throw new Error('tried to start game loop interval twice?');

  if(this.heartbeatInterval != null)
    throw new Error('tried to start heart beat interval twice?');

  if(typeof this.Parameters.vtPeriodInMillis !== 'number')
    throw new Error('exports.vtPeriodInMillis must be defined in shared/parameters.js and must be a number');

  var dis = this;

  this.nextIteration = Date.now();

  // loopy just thinking about it
  this.gameLoopInterval = setInterval(function(){ 
    dis.loop(); 
  }, this.Parameters.vtPeriodInMillis);

  // dont be still, my beating heart
  this.heartbeatInterval = setInterval(function(){ 
    dis.fire('heartbeat', 0); 
  }, 10000);
};

Game.prototype.loop = function(){
  for(var now = Date.now(); now > this.nextIteration; this.nextIteration += this.Parameters.vtPeriodInMillis)
    this.state.clock++; 

  // we don't have to call this every loop. in fact, it may be a good idea to do this once per second or something
  this.Engine.safelyAdvance(this.state);
};

Game.prototype.buildEvent = function(type, senderSessionId, data){
  if(type == null || senderSessionId == null)
    throw new Exception('fire requires a type and a session id');

  return {
    type: type, 
    data: data, 
    vt: this.state.clock + this.Utilities.ms2ticks(this.Parameters.eventDelayMillis),
    senderSessionId: senderSessionId
  };
};

Game.prototype.fire = function(event){
  this.state.events.push(event);
  this.network.broadcast(event.type, event);
};

exports.Game = Game;
