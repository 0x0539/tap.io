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

    $('body').html([
      '<h2>Safe State</h2>',
      '<b>clock<b> is ' + this.game.state.clock,
      '<b>vt</b> is ' + this.game.state.vt,
      '<b>event count</b> is ' + this.game.state.events.length,
      '<b>player count</b> is ' + this.game.state.sessionIds.length,
      '<h2>Projected State</h2>',
      '<b>clock</b> is ' + state.clock,
      '<b>vt</b> is ' + state.vt,
      '<b>event count</b> is ' + state.events.length,
      '<b>player count</b> is ' + state.sessionIds.length
    ].join('<br/>'))


    // handle teh rendar!
  };

  return SnakeRenderer;
  
})();
