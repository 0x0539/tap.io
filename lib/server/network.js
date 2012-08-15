var Network = function(port){
  this.IO = require('socket.io');
  this.sessionIdCounter = 1;
  this.sockets = {};
  this.port = port;
};

// this network object is an event emitter
var events = require('events');
Network.prototype = new events.EventEmitter;

Network.prototype.start = function(){
  var dis = this;

  if(this.io != null)
    throw new Error('tried to start server twice?');

  // get a new server
  this.io = this.IO.listen(this.port);

  // when we get a connection
  this.io.sockets.on('connection', function(socket){
    dis.onConnection(socket);
  });
};

Network.prototype.onConnection = function(socket){
  var dis = this;

  // assigns a new sessionId, preserved in the scope
  var sessionId = this.sessionIdCounter++;

  this.sockets[sessionId] = socket; // grab the socket
  this.emit('connect', sessionId);

  socket.on('disconnect', function(){
    delete dis.sockets[sessionId]; // dump the socket
    dis.emit('disconnect', sessionId);
  });

  socket.on('gameevent', function(event){
    dis.emit('gameevent', sessionId, event);
  });

  socket.on('heartbeat', function(){
    dis.emit('heartbeat', sessionId);
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
