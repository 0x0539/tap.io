window.Renderer = (function(){

  var Renderer = function(game){
    var dis = this;

    if(game == null)
      throw new Error('game is a required argument');

    this.game = game;

    // start the rendering!
    (function render(){
      dis.requestAnimationFrame(render);
      dis.renderScene();
    })();
  };

  // taken from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  Renderer.prototype.requestAnimationFrame = (function(){
    return window.requestAnimationFrame       || 
           window.webkitRequestAnimationFrame || 
           window.mozRequestAnimationFrame    || 
           window.oRequestAnimationFrame      || 
           window.msRequestAnimationFrame     || 
           function(callback){ window.setTimeout(callback, 1000 / 60); };
  })();

  Renderer.prototype.renderScene = function(){
  };

  return Renderer;

})();
