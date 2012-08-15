window.Game = (function(){
  var Game = function(baseurl){
    this.socket = window.io.connect(baseurl);

    var dis = this;

    this.socket.on('game data', function(data){
      dis.state = data;
    });

    var addEvent = function(event){ dis.addEvent(event); };

    this.socket.on('session start', addEvent);
    this.socket.on('session end', addEvent);
    this.socket.on('game event', addEvent);
    this.socket.on('heart beat', addEvent);
  };

  Game.prototype.addEvent = function(event){
    this.state.events.push(event);
  };

  // TODO: create setInterval for heart beat
  // TODO: create setInterval for game loop
  // TODO: create method for emitting game events (user input)

  return Game;
})();
