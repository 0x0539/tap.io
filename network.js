var io = require('socket.io'),
    events = require('events');

exports.Network = function(port){

  var dis = this;

  this.sessionIdCounter = 1;
  this.sockets = {};

  this.io = io.listen(port);

  // create proxy events through network, and assign session id
  this.io.sockets.on('connection', function(socket){
    // assigns a new sessionId
    var sessionId = dis.sessionIdCounter++;

    dis.sockets[sessionId] = socket;
    dis.emit('connect', sessionId);

    socket.on('disconnect', function(){
      delete dis.sockets[sessionId];
      dis.emit('disconnect', sessionId);
    });

    socket.on('gameevent', function(event){
      dis.emit('gameevent', event, sessionId);
    });

  });
};

// this network object is an event emitter
exports.Network.prototype = new events.EventEmitter;

// broadcast an event to everyone
exports.Network.prototype.broadcast = function(type, data){
  for(var sessionId in this.sockets)
    this.send(sessionId, type, data);
};

// send an event to one person
exports.Network.prototype.send = function(sessionId, type, data){
  this.sockets[sessionId].emit(type, data);
};
