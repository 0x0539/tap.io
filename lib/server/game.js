var Game = function(network, state){
  var dis = this;

  if(network == null)
    throw new Error('network is a required argument');

  this.Engine = require('../shared/engine.js').Engine;
  this.Parameters = require('../shared/parameters.js').Parameters;
  this.Utilities = require('../shared/utilities.js').Utilities;
  this.Random = require('../shared/random.js').Random;
  this.Serializer = require('../shared/serializer.js').Serializer;

  this.network = network;

  // game data, should be flat js objects
  this.state = state || {
    clock: 0,
    vt: 0,
    events: [],
    sessionIds: [0],
    arc4: new this.Random(new Date().toString()).arc4
  };

  if(this.state.clock == null)
    throw new Error('state clock is missing');

  if(this.state.vt == null)
    throw new Error('state vt is missing');

  if(this.state.events == null)
    throw new Error('state events array is missing');

  if(this.state.sessionIds == null)
    throw new Error('state sessionIds array is missing');

  if(this.state.arc4 == null)
    throw new Error('state arc4 data is missing');

  // disconnect all non-server users because nobody is connected right now
  for(var i = 0; i < this.state.sessionIds.length; i++){
    var sessionId = this.state.sessionIds[i];
    if(sessionId != 0){
      var event = this.buildEvent('endSession', 0, {sessionId: sessionId});
      this.state.events.push(event); // hotwire the event to the state
    }
  }

  this.network.on('tap.io', function(sessionId, frame){
    dis.onReceive(sessionId, frame);
  });

  this.network.on('disconnect', function(sessionId){
    dis.onDisconnect(sessionId);
  });

  this.network.on('connect', function(sessionId){
    dis.onConnect(sessionId);
  });
};

Game.prototype.onReceive = function(sessionId, frame){
  switch(frame.type) {
    case 'pong':
      // ignore
      break;
    case 'gameevent':
      this.fireEvent({
        type: 'gameevent',
        senderSessionId: sessionId,
        data: frame.data
      });
      break;
    case 'heartbeat':
      this.fireEvent({
        type: 'heartbeat',
        senderSessionId: sessionId
      });
      break;
    default:
      throw new Error('received unknown frame type: ' + frame.type);
  }
};

Game.prototype.onDisconnect = function(sessionId){
  this.fireEvent({
    type: 'endSession',
    senderSessionId: 0,
    data: { sessionId: sessionId }
  });
};

Game.prototype.onConnect = function(sessionId){
  this.sendFrame(sessionId, {
    type: 'bootstrap',
    senderSessionId: 0,
    data: this.Serializer.serialize({
      state: this.state,
      sessionId: sessionId
    })
  });
  this.fireEvent({
    type: 'startSession',
    senderSessionId: 0,
    data: { sessionId: sessionId }
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

  this.gameLoopInterval = setInterval(function(){ 
    dis.loop(); 
  }, this.Parameters.vtPeriodInMillis);

  // send server heartbeat
  this.heartbeatInterval = setInterval(function(){ 
    dis.fireEvent({
      type: 'heartbeat',
      senderSessionId: 0
    });
  }, 10000);

  this.gameCompactInterval = setInterval(function(){
    dis.Engine.safelyAdvance(dis.state);
  }, 1000);
};

Game.prototype.loop = function(){
  for(var now = Date.now(); now > this.nextIteration; this.nextIteration += this.Parameters.vtPeriodInMillis)
    this.state.clock++; 
};

Game.prototype.sendFrame = function(sessionId, frame){
  if(frame.type == null || frame.senderSessionId == null)
    throw new Exception('frames require type and session id');

  this.network.send(sessionId, frame);
};

Game.prototype.fireEvent = function(frame){
  if(frame.type == null || frame.senderSessionId == null)
    throw new Exception('frames require type and session id');

  if(frame.vt == null)
    frame.vt = this.state.clock;

  this.state.events.push(frame);
  this.network.broadcast(frame);
};

exports.Game = Game;
