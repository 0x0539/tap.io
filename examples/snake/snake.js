(function(tapio){
  var FOOD_COUNT = 5;

  var SNAKE_GROWTH_RATE = 10;
  var SNAKE_START_LENGTH = 50;
  var SNAKE_SPEED = 10;

  var MIN_X = 0;
  var MAX_X = 200;
  var MIN_Y = 0;
  var MAX_Y = 200;

  var Extension = function() {};
  Extension.prototype.update = function(state) {
    while(state.food.length < FOOD_COUNT){
      var food = new Food(this.randomX(state), this.randomY(state));
      state.food.push(food);
    }
    for(var sessionId in state.players){
      var player = state.players[sessionId];
      if(player.snake){
        player.snake.move();
      }
    }
  };
  Extension.prototype.validate = function(state, event) { };
  Extension.prototype.handle = function(state, event) { 
    switch(event.type) {
      case tapio.Events.NEW_SESSION:
        state.players[event.senderSessionId] = new Player(event.senderSessionId);
        break;
      case tapio.Events.END_SESSION:
        delete state.players[event.senderSessionId];
        break;
      case tapio.Events.CUSTOM:
        this.handleCustomEvent(state, event.senderSessionId, event.data);
        break;
    }
  };
  Extension.prototype.handleCustomEvent = function(state, sessionId, event){
    var player = state.players[sessionId];
    switch(event.type) {
      case 'left':
        player.turn(-1, 0);
        break;
      case 'right':
        player.turn(1, 0);
        break;
      case 'up':
        player.turn(0, -1);
        break;
      case 'down':
        player.turn(0, 1);
        break;
      case 'respawn':
        player.respawn(new Snake(this.randomX(state), this.randomY(state)));
        break;
    }
  };
  Extension.prototype.randomX = function(state) {
    return state.random.random() * (MAX_X - MIN_X) + MIN_X;
  };
  Extension.prototype.randomY = function(state) {
    return state.random.random() * (MAX_Y - MIN_Y) + MIN_Y;
  };

  var Food = function(x, y) {
    tapio.Serializer.registerInstance(this, Food);
    this.x = x;
    this.y = y;
  };

  var Joint = function(x, y, dx, dy) {
    tapio.Serializer.registerInstance(this, Joint);
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
  };
  Joint.prototype.distanceTo = function(other) {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  };

  var Segment = function(x1, y1, x2, y2){
    tapio.Serializer.registerInstance(this, Segment);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  };

  var Snake = function(x, y) {
    tapio.Serializer.registerInstance(this, Snake);
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.joints = [];
    this.eaten = 0;
    // Start with 1 food.
    this.feed();
  };
  Snake.prototype.turn = function(dx, dy) {
    if (this.dx == 0 && this.dy == 0 || this.dx*this.dx != dx*dx && this.dy*this.dy != dy*dy) {
      this.joints.push(new Joint(this.x, this.y, this.dx, this.dy));
      this.dx = dx;
      this.dy = dy;
    }
  };
  Snake.prototype.move = function() {
    this.x += this.dx * SNAKE_SPEED;
    this.y += this.dy * SNAKE_SPEED;
  };
  Snake.prototype.getLength = function() {
    return SNAKE_START_LENGTH + this.eaten * SNAKE_GROWTH_RATE;
  };
  Snake.prototype.feed = function() {
    var segments = this.getSegments();
    var lastSegment = segments[segments.length-1];
    // Add a joint at the end of the snake so that we grow while moving.
    this.joints.push(new Joint(lastSegment.x2, lastSegment.y2, 0, 0));
  };
  Snake.prototype.getSegments = function() {
    var segments = [];
    var length = this.getLength();

    var j1 = new Joint(this.x, this.y, this.dx, this.dy);
    var j2 = j1;

    for (var j = 0; j < this.joints.length; j++) {
      j2 = this.joints[j];

      var gap = j1.distanceTo(j2);
      if (length >= gap) {
        length -= gap;
        segments.push(new Segment(j1.x, j1.y, j2.x, j2.y));
      } else {
        this.joints = this.joints.slice(0, j);
        break;
      }

      j1 = j2;
    }

    // Add the remainder of the length as a segment.
    if (length > 0) {
      segments.push(new Segment(j2.x, j2.y, j2.x - j2.dx * length, j2.y - j2.dy * length));
    }
    return segments;
  };

  var Player = function() {
    tapio.Serializer.registerInstance(this, Player);
    this.snake = null;
  };
  Player.prototype.turn = function(dx, dy){
    if (this.snake) 
      this.snake.turn(dx, dy);
  };
  Player.prototype.respawn = function(snake){
    if (this.snake == null)
      this.snake = snake;
  };

  tapio.Serializer.registerType(Food);
  tapio.Serializer.registerType(Joint);
  tapio.Serializer.registerType(Segment);
  tapio.Serializer.registerType(Snake);
  tapio.Serializer.registerType(Player);

  exports.SnakeExtension = Extension;
})(typeof tapio == 'undefined' ? require('tap.io') : tapio);
