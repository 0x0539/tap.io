window.RenderLoop = (function(){

  var RenderLoop = function(game, renderer){
    var dis = this;

    if(game == null)
      throw new Error('game is a required argument');

    if(renderer == null)
      throw new Error('renderer is a required argument');

    if(typeof renderer.render != 'function')
      throw new Error('renderer does not define a render function');

    this.game = game;
    this.renderer = renderer;

    // start the rendering!
    (function renderTimerCallback(){
      window.rAF(renderTimerCallback);
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

  return RenderLoop;

})();
