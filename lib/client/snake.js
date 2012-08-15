window.Snake = (function(){
  exports.Engine.plugins.push(exports.SnakeEngine);

  var Snake = function(baseurl){
    this.game = new Game(baseurl);
  };

  return Snake;
)();
