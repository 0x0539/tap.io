window.SnakeRenderer = (function(){

  var SnakeRenderer = function(game){
    window.Renderer.call(this, game); // call super constructor
  };

  // set up inheritance from Renderer
  var Surrogate = function(){};
  Surrogate.prototype = window.Renderer.prototype;
  SnakeRenderer.prototype = new Surrogate();
  SnakeRenderer.prototype.constructor = SnakeRenderer;

  // magic!
  SnakeRenderer.prototype.render = function(){
    if(this.game.projectedState == null)
      return; // nothing to do

    if(this.game.sessionId == null)
      throw new Error('no session id set. who am i?');

    var state = this.game.projectedState,
        sessionId = this.game.sessionId;

    // handle teh rendar!
  };

  return SnakeRenderer;
  
})();
