window.Snake = (function(){
  exports.Engine.plugins.push(exports.SnakeEngine);

  var Snake = function(game){
    this.game = game;
  };

  return Snake;
)();
