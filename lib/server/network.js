var Network = function(server){
  this.IO = require('socket.io');

  // unique session id's for clients
  this.sessionIdCounter = 1;

  // http server to wrap socket around
  this.server = server;

  // defined per client
  this.sockets = {};
  this.pingers = {};
  this.latency = {};
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
  var dis = this;

  // assigns a new sessionId, preserved in the scope
  var sessionId = this.getNextSessionId();

  this.sockets[sessionId] = socket; // grab the socket
  this.latency[sessionId] = null; // rolling-avg latency estimate
  this.pingers[sessionId] = setInterval(function(){
    // TODO: make sure we don't flood pings
    dis.send(sessionId, 'ping', {start: Date.now()});
  }, 3000);

  this.emit('startSession', sessionId);

  socket.on('disconnect', function(){
    clearInterval(dis.pingers[sessionId]);
    delete dis.sockets[sessionId]; // dump the socket
    delete dis.latency[sessionId]; // dump the latency estimate
    delete dis.pingers[sessionId]; // dump the ping interval
    dis.emit('endSession', sessionId);
  });

  socket.on('gameevent', function(event){
    dis.emit('gameevent', sessionId, event);
  });

  socket.on('heartbeat', function(){
    dis.emit('heartbeat', sessionId);
  });

  socket.on('pong', function(event){
    if(isNaN(event.start))
      return;
    var rtt = Date.now() - event.start,
        est = dis.latency[sessionId] || rtt;
    dis.latency[sessionId] = (est * 4.0 + rtt) / 5.0;
  });
}

// broadcast an event to everyone
Network.prototype.broadcast = function(type, data){
  for(var sessionId in this.sockets)
    this.send(sessionId, type, data);
};

// send an event to one person
Network.prototype.send = function(sessionId, type, data){
  this.sockets[sessionId].emit(type, data);
};

exports.Network = Network;
