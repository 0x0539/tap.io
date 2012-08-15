window.Game = (function(){

  var Game = function(socket){
    if(socket == null)
      throw new Error('socket is a required argument');

    this.socket = socket;

    var dis = this;

    this.socket.on('bootstrap', function(data){
      dis.state = data.state;
      dis.sessionId = data.sessionId;
      dis.start();
    });

    var addEvent = function(event){ dis.addEvent(event); };

    this.socket.on('startSession', addEvent);
    this.socket.on('endSession', addEvent);
    this.socket.on('gameevent', addEvent);
    this.socket.on('heartbeat', addEvent);
  };

  Game.prototype.addEvent = function(event){
    this.state.events.push(event);
    if(event.vt >= this.projectedState.vt)
      this.projectedState.events.push(event);
    else
      this.projectedState = null; // invalidate projected state, event in the past was received
  };

  Game.prototype.start = function(){
    if(this.state == null)
      throw new Error('tried to start before bootstrapping game data?');

    if(this.sessionId == null)
      throw new Error('tried to start before bootstrapping session id?');

    if(this.heartbeatInterval != null)
      throw new Error('tried to start heartbeat interval twice?');

    if(this.gameLoopInterval != null)
      throw new Error('tried to start game loop interval twice?');

    var dis = this;

    this.nextIteration = Date.now();

    this.heartbeatInterval = setInterval(function(){
      dis.socket.emit('heartbeat');
    }, 1000);

    this.gameLoopInterval = setInterval(function(){
      dis.loop();
    }, exports.Parameters.vtPeriodInMillis);
  };

  Game.prototype.loop = function(){
    if(this.state == null)
      throw new Error('we do not have state yet, was loop() called before bootstrap received?');

    if(this.sessionId == null)
      throw new Error('we do not have a session id yet, was loop() called before bootstrap received?');

    // reset projected state to safe state if invalidating event was received
    if(this.projectedState == null)
      this.projectedState = $.extend(true, {}, this.state);

    // update clocks for every iteration we missed
    for(var now = Date.now(); now > this.nextIteration; this.nextIteration += exports.Parameters.vtPeriodInMillis){
      this.state.clock++;
      this.projectedState.clock++;
    }

    // we don't have to do this every loop. it may be a good idea to do this once per second or something
    exports.Engine.safelyAdvance(this.state);

    // we should try our best to update the projected state in real-time, since it gets rendered
    exports.Engine.advanceTo(this.projectedState, this.projectedState.clock);
  };

  Game.prototype.emit = function(type, data){
    this.socket.emit(type, data);
  };

  return Game;
})();
