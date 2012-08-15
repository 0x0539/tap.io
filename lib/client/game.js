window.Game = (function(){
  var Game = function(baseurl){
    this.socket = window.io.connect(baseurl);

    var dis = this;

    this.socket.on('gamedata', function(data){
      dis.state = data;
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
      throw new Error('tried to start before receiving gamedata?');

    if(this.heartbeatInterval != null)
      throw new Error('tried to start heartbeat interval twice?');

    if(this.gameLoopInterval != null)
      throw new Error('tried to start game loop interval twice?');

    var dis = this;

    this.heartbeatInterval = setInterval(function(){
      dis.socket.emit('heartbeat');
    }, 1000);

    this.gameLoopInterval = setInterval(function(){
      dis.loop();
    }, exports.Parameters.vtPeriodInMillis);
  };

  Game.prototype.updateState = function(){
    // clock may get out of sync on client (if we assume state agreement, have to ignore clock)
    this.state.clock++; 
    exports.Engine.safelyAdvance(this.state);
  };

  Game.prototype.updateProjectedState = function(){
    // clock may get out of sync on client (if we assume state agreement, have to ignore clock)
    this.projectedState.clock++;
    exports.Engine.advanceTo(this.projectedState, this.projectedState.clock);
  };

  Game.prototype.loop = function(){
    if(this.state == null)
      throw new Error('we do not have state yet, was loop() called before gamedata received?');

    // reset projected state to safe state if invalidating event was received
    if(this.projectedState == null)
      this.projectedState = $.extend(true, {}, this.state);

    // update the states independently
    this.updateState();
    this.updateProjectedState();
  };

  Game.prototype.emit = function(type, data){
    this.socket.emit(type, data);
  };

  return Game;
})();
