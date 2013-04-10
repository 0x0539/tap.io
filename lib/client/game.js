window.Game = (function(){

  var Events = window.Constants.Events;

  var Game = function(socket){
    var dis = this;

    if(socket == null)
      throw new Error('socket is a required argument');

    this.socket = socket;
    this.socket.on('tap.io', function(frame){
      dis.onReceive(frame);
    });
  };

  Game.prototype.onReceive = function(frame){
    switch(frame.type){
      case Events.BOOTSTRAP:
        var data = window.Serializer.deserialize(frame.data);
        this.state = data.state;
        this.sessionId = data.sessionId;
        this.start();
        break;
      case Events.PING:
        this.send(Events.PONG, frame.data);
        break;
      case Events.NEW_SESSION:
      case Events.END_SESSION:
      case Events.CUSTOM:
      case Events.EMPTY:
        this.addEvent(frame);
        break;
      default:
        throw new Error('unknown frame type ' + frame.type);
    };
  };

  Game.prototype.addEvent = function(event){
    this.state.events.push(event);

    // projected state could be null for two reasons:
    // 1 - we just bootstrapped and have not reached the game loop
    // 2 - some other event just invalidated this and we have not reached the game loop
    // in either case, we can safely not apply the event to the projected state
    if(this.projectedState != null){
      if(event.vt >= this.projectedState.vt){
        this.projectedState.events.push(event);

        // sync clocks, set nextIteration to happen in the future by 1 vt period
        this.projectedState.clock = this.state.clock = event.vt;
        this.nextIteration = Date.now() + window.Parameters.vtPeriodInMillis;
      }
      else{
        var msGap = window.Utilities.ticks2ms(this.projectedState.vt - event.vt);
        console.log("projected=" + this.projectedState.vt + ', event=' + event.vt + ', missed by ' + msGap + 'ms');
        this.projectedState = null; // invalidate projected state, event in the past was received
      }
    }
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

    if(this.gameCompactInterval != null)
      throw new Error('tried to start game compact interval twice?');

    var dis = this;

    this.nextIteration = Date.now();

    // send client heartbeat
    this.heartbeatInterval = setInterval(function(){
      if(dis.idle)
        dis.send(Events.EMPTY);
      dis.idle = true;
    }, 10000);

    this.gameLoopInterval = setInterval(function(){
      dis.loop();
    }, window.Parameters.vtPeriodInMillis);

    this.gameCompactInterval = setInterval(function(){
      window.Engine.safelyAdvance(dis.state);
    }, 1000);
  };

  Game.prototype.loop = function(){
    if(this.state == null)
      throw new Error('we do not have state yet, was loop() called before bootstrap received?');

    if(this.sessionId == null)
      throw new Error('we do not have a session id yet, was loop() called before bootstrap received?');

    // reset projected state to safe state if invalidating event was received
    if(this.projectedState == null)
      this.projectedState = window.Cloner.clone(this.state);

    // update clocks for every iteration we missed
    for(var now = Date.now(); now > this.nextIteration; this.nextIteration += window.Parameters.vtPeriodInMillis){
      this.state.clock++;
      this.projectedState.clock++;
    }

    // we should try our best to update the projected state in real-time, since it gets rendered
    window.Engine.advanceTo(this.projectedState, this.projectedState.clock);
  };

  Game.prototype.send = function(type, data){
    if(type == Events.CUSTOM)
      this.idle = false;
    this.socket.emit('tap.io', {type: type, data: data});
  };

  return Game;
})();
