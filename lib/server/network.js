var Network = function(server){
  this.IO = require('socket.io');
  this.Session = require('./session.js').Session

  // unique session id's for clients
  this.sessionIdCounter = 1;

  // http server to wrap socket around
  this.server = server;

  // defined per client
  this.sessions = {};

  // the pinger for latency estimates
  var dis = this;
  this.pinger = setInterval(function(){
    dis.broadcast({
      type: 'ping',
      senderSessionId: 0,
      data: { start: Date.now() }
    });
  }, 5000);
};

// this network object is an event emitter
var events = require('events');
Network.prototype = new events.EventEmitter;

Network.prototype.start = function(){
  var dis = this;

  if(this.io != null)
    throw new Error('tried to start server twice?');

  // get a new server
  this.io = this.IO.listen(this.server);

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
  this.sessions[sessionId] = new this.Session(this, socket, sessionId);

  // start the new session
  this.sessions[sessionId].start();
}

// broadcast an event to everyone
Network.prototype.broadcast = function(frame){
  for(var sessionId in this.sessions)
    this.sessions[sessionId].send(frame);
};

// send an event to one person
Network.prototype.send = function(sessionId, frame){
  console.log(frame);
  this.sessions[sessionId].send(frame);
};

exports.Network = Network;
