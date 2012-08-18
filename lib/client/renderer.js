window.Renderer = (function(){

  var Renderer = function(game, renderer){
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

  Renderer.prototype.renderWrapper = function(){
    if(this.game.projectedState == null)
      return; // nothing to do

    if(this.game.sessionId == null)
      throw new Error('no session id set. who am i?');

    this.renderer.render(this.game.sessionId, this.game.projectedState);
  };

  return Renderer;

})();
