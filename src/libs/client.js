var Game = function(socket){
  var dis = this;

  if(socket == null)
    throw new Error('socket is a required argument');

  this.socket = socket;
  this.socket.on('tap.io', function(frame){
    frame = tapio.Serializer.deserialize(frame);
    dis.onReceive(frame);
  });
};
Game.prototype.onReceive = function(frame){
  switch(frame.type){
    case tapio.Events.BOOTSTRAP:
      var data = tapio.Serializer.deserialize(frame.data);
      this.state = data.state;
      this.sessionId = data.sessionId;
      this.start();
      break;
    case tapio.Events.PING:
      this.send({type: tapio.Events.PONG, data: frame.data});
      break;
    case tapio.Events.NEW_SESSION:
    case tapio.Events.END_SESSION:
    case tapio.Events.CUSTOM:
    case tapio.Events.EMPTY:
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
      this.nextIteration = Date.now() + tapio.Parameters.vtPeriodInMillis;
    }
    else{
      var msGap = tapio.Utilities.ticks2ms(this.projectedState.vt - event.vt);
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

  this.heartbeatInterval = setInterval(function(){
    if(dis.idle)
      dis.send({type: tapio.Events.EMPTY});
    dis.idle = true;
  }, 10000);

  this.gameLoopInterval = setInterval(function(){
    dis.loop();
  }, tapio.Parameters.vtPeriodInMillis);

  this.gameCompactInterval = setInterval(function(){
    tapio.Engine.safelyAdvance(dis.state);
  }, 1000);
};
Game.prototype.loop = function(){
  if(this.state == null)
    throw new Error('we do not have state yet, was loop() called before bootstrap received?');

  if(this.sessionId == null)
    throw new Error('we do not have a session id yet, was loop() called before bootstrap received?');

  // reset projected state to safe state if invalidating event was received
  if(this.projectedState == null)
    this.projectedState = tapio.Cloner.clone(this.state);

  // update clocks for every iteration we missed
  for(var now = Date.now(); now > this.nextIteration; this.nextIteration += tapio.Parameters.vtPeriodInMillis){
    this.state.clock++;
    this.projectedState.clock++;
  }

  // we should try our best to update the projected state in real-time, since it gets rendered
  tapio.Engine.advanceTo(this.projectedState, this.projectedState.clock);
};
Game.prototype.send = function(frame){
  if(frame.type == null)
    throw new Error('frame type is required');
  if(frame.type == tapio.Events.CUSTOM)
    this.idle = false;
  this.socket.emit('tap.io', tapio.Serializer.serialize(frame));
};

var rAF = (function(){
  return window.requestAnimationFrame       || 
         window.webkitRequestAnimationFrame || 
         window.mozRequestAnimationFrame    || 
         window.oRequestAnimationFrame      || 
         window.msRequestAnimationFrame     || 
         function(callback){ 
           window.setTimeout(callback, 1000 / 30); 
         };
})();

var RenderLoop = function(game, renderer){
  if(game == null)
    throw new Error('game is a required argument');
  if(renderer == null)
    throw new Error('renderer is a required argument');
  if(typeof renderer.render != 'function')
    throw new Error('renderer does not define a render function');

  this.game = game;
  this.renderer = renderer;

  var dis = this;

  // start the rendering!
  (function renderTimerCallback(){
    rAF(renderTimerCallback);
    dis.renderWrapper();
  })();
};

RenderLoop.prototype.renderWrapper = function(){
  if(this.game.projectedState == null)
    return; // probably still waiting on initialization, nothing to do yet

  if(this.game.sessionId == null)
    throw new Error('no session id set. who am i?');

  this.renderer.render(this.game.sessionId, this.game.projectedState);
};

exports.Game = Game;
exports.RenderLoop = RenderLoop;
