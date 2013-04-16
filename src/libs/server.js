var shared = require('./shared.js');
var IO = require('socket.io');
var events = require('events');

// Wraps a client connection and propagates high-level events via Network.
// Session implements low-level, per-connection functionality 
// like latency measurement that has nothing to do with the rest of the stack.
var Session = function(network, socket, sessionId) {
  var dis = this;

  this.network = network;
  this.socket = socket;
  this.sessionId = sessionId;

  // latency estimate in seconds 
  this.rttEstimate = 0;

  this.socket.on('tap.io', function(frame) {
    // handle the pong event specially
    if(frame.type == shared.Events.PONG)
      dis.onPong(frame);
    dis.network.emit('tap.io', dis.sessionId, frame);
  });

  this.socket.on('disconnect', function() {
    dis.network.emit('disconnect', dis.sessionId);
  });
};
Session.prototype.start = function() {
  this.network.emit('connect', this.sessionId);
};
Session.prototype.onPong = function(frame) {
  var evt = frame.data;

  if (isNaN(evt.start))
    return;

  var rttSample = Date.now() - evt.start;

  if (this.rttEstimate == 0)
    this.rttEstimate = rttSample;
  else
    this.rttEstimate = (this.rttEstimate * 4.0 + rttSample) / 5.0;
};
Session.prototype.getLatency = function() {
  return this.rttEstimate / 2.0;
};
Session.prototype.send = function(frame){ 
  this.socket.emit('tap.io', frame);
};

/**
 * Wraps all of the session sockets, serves as an event emitter translating
 * low-level socket events to higher level ones.
 */
var Network = function(server){
  var dis = this;

  // unique session id's for clients
  this.sessionIdCounter = 1;

  // http server to wrap socket around
  this.server = server;

  // defined per client
  this.sessions = {};

  this.pinger = setInterval(function(){
    dis.broadcast({
      type: shared.Events.PING,
      senderSessionId: 0,
      data: { start: Date.now() }
    });
  }, 10000);

  // clean up sessions after they disconnect
  this.on('disconnect', function(sessionId){
    dis.onDisconnect(sessionId);
  });
};
// this network object is an event emitter
Network.prototype = new events.EventEmitter;
Network.prototype.start = function(){
  var dis = this;

  if(this.io != null)
    throw new Error('tried to start server twice?');

  // get a new server
  this.io = IO.listen(this.server);

  // when we get a connection
  this.io.sockets.on('connection', function(socket){
    dis.onConnection(socket);
  });
};
Network.prototype.getNextSessionId = function(){
  return Date.now() + '-' + this.sessionIdCounter++;
};
Network.prototype.onConnection = function(socket){
  // assigns a new sessionId, preserved in the scope
  var sessionId = this.getNextSessionId();

  // creates a new session and saves it
  this.sessions[sessionId] = new Session(this, socket, sessionId);

  // start the new session
  this.sessions[sessionId].start();
}
Network.prototype.onDisconnect = function(sessionId){
  delete this.sessions[sessionId];
};
Network.prototype.broadcast = function(frame){
  for(var sessionId in this.sessions)
    this.sessions[sessionId].send(frame);
};
Network.prototype.send = function(sessionId, frame){
  this.sessions[sessionId].send(frame);
};

/**
 * Game class
 * ==========
 * Represents the server-side wrapper for the game. Has
 * a Network instance that it uses for all communication.
 * Contains all the interesting logic pertaining to event 
 * broadcasting, security, etc.
 */
var Game = function(network, state){
  var dis = this;

  if(network == null)
    throw new Error('network is a required argument');

  this.network = network;

  // game data
  this.state = state || {};
  this.state.clock = 0;
  this.state.vt = 0;
  this.state.events = [];
  this.state.sessionIds = [0];

  // disconnect all non-server users because nobody is connected right now
  for(var i = 0; i < this.state.sessionIds.length; i++){
    var sessionId = this.state.sessionIds[i];
    if(sessionId != 0){
      // hotwire the event to the state
      this.state.events.push({
        type: shared.Events.END_SESSION,
        senderSessionId: 0,
        data: {sessionId: sessionId},
        vt: this.state.clock
      }); 
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
    case shared.Events.PONG:
      // ignore
      break;
    case shared.Events.CUSTOM:
      this.fireEvent({
        type: shared.Events.CUSTOM,
        senderSessionId: sessionId,
        data: frame.data
      });
      break;
    case shared.Events.EMPTY:
      console.log('empty');
      this.fireEvent({
        type: shared.Events.EMPTY,
        senderSessionId: sessionId
      });
      break;
    default:
      throw new Error('received unknown frame type: ' + frame.type);
  }
};
Game.prototype.onDisconnect = function(sessionId){
  this.fireEvent({
    type: shared.Events.END_SESSION,
    senderSessionId: 0,
    data: { sessionId: sessionId }
  });
};
Game.prototype.onConnect = function(sessionId){
  this.sendFrame(sessionId, {
    type: shared.Events.BOOTSTRAP,
    senderSessionId: 0,
    data: shared.Serializer.serialize({
      state: this.state,
      sessionId: sessionId
    })
  });
  this.fireEvent({
    type: shared.Events.NEW_SESSION,
    senderSessionId: 0,
    data: { sessionId: sessionId }
  });
};
Game.prototype.start = function(){
  if(this.gameLoopInterval != null)
    throw new Error('tried to start game loop interval twice?');

  if(this.heartbeatInterval != null)
    throw new Error('tried to start heart beat interval twice?');

  if(typeof shared.Parameters.vtPeriodInMillis !== 'number')
    throw new Error('exports.vtPeriodInMillis must be defined in shared/parameters.js and must be a number');

  var dis = this;

  this.nextIteration = Date.now();

  this.gameLoopInterval = setInterval(function(){ 
    dis.loop(); 
  }, shared.Parameters.vtPeriodInMillis);

  // send server heartbeat
  this.heartbeatInterval = setInterval(function(){ 
    dis.fireEvent({
      type: shared.Events.EMPTY,
      senderSessionId: 0
    });
  }, 10000);

  this.gameCompactInterval = setInterval(function(){
    shared.Engine.safelyAdvance(dis.state);
  }, 1000);
};
Game.prototype.loop = function(){
  for(var now = Date.now(); now > this.nextIteration; this.nextIteration += shared.Parameters.vtPeriodInMillis)
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

exports.Session = Session;
exports.Game = Game;
exports.Network = Network;
