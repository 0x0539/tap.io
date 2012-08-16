window.Renderer = (function(){

  var Renderer = function(game){
    var dis = this;

    if(game == null)
      throw new Error('game is a required argument');

    this.game = game;

    // start the rendering!
    (function renderTimerCallback(){
      window.rAF(renderTimerCallback);
      dis.render();
    })();
  };

  Renderer.prototype.render = function(){
    throw new Error('render not implemented!');
  };

  return Renderer;

})();
