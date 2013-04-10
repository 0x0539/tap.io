var Events = require('../shared/constants.js').Constants.Events;

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
    if(frame.type == Events.PONG)
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

exports.Session = Session;
