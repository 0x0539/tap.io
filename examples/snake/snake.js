var tapio = typeof window == 'undefined' ? require('tap.io') : window.tapio;

var FOOD_COUNT = 5;

var SNAKE_GROWTH_RATE = 10;
var SNAKE_START_LENGTH = 50;
var SNAKE_SPEED = 1;

var MIN_X = 0;
var MAX_X = 200;
var MIN_Y = 0;
var MAX_Y = 200;

var SnakeEngine = function() {
  tapio.Serializer.registerInstance(this, SnakeEngine);
  this.random = new tapio.Random(Math.floor(Math.random() * 100));
  this.food = [];
  this.players = {};
};
SnakeEngine.prototype.update = function(state) {
  while(this.food.length < FOOD_COUNT){
    this.food.push(new Food(this.randomX(), this.randomY()));
  }
  for(var sessionId in this.players){
    this.players[sessionId].move();
  }
};
SnakeEngine.prototype.validate = function(state, event) { };
SnakeEngine.prototype.handle = function(state, event) { 
  switch(event.type) {
    case tapio.Events.NEW_SESSION:
      this.players[event.data.sessionId] = new Player(event.data.sessionId);
      break;
    case tapio.Events.END_SESSION:
      delete this.players[event.data.sessionId];
      break;
    case tapio.Events.CUSTOM:
      this.handleCustomEvent(state, event.senderSessionId, event.data);
      break;
  }
};
SnakeEngine.prototype.handleCustomEvent = function(state, sessionId, event){
  var player = this.players[sessionId];
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
      player.respawn(new Snake(this.randomX(), this.randomY()));
      break;
  }
};
SnakeEngine.prototype.randomX = function() {
  return this.random.random() * (MAX_X - MIN_X) + MIN_X;
};
SnakeEngine.prototype.randomY = function() {
  return this.random.random() * (MAX_Y - MIN_Y) + MIN_Y;
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
  this.eaten = 1;
};
Snake.prototype.turn = function(dx, dy) {
  if (dx != 0 && dx != 1 && dx != -1)
    throw new Error('you can only choose 0 or 1 or -1');
  if (dy != 0 && dy != 1 && dy != -1)
    throw new Error('you can only choose 0 or 1 or -1');
  if ((this.dx == 0 && this.dy == 0) || (Math.abs(dx - this.dx) == 1 && Math.abs(dy - this.dy) == 1)) {
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
  this.eaten++;
};
Snake.prototype.getSegments = function() {
  var segments = [];
  var remainder = this.getLength();
  var j1 = new Joint(this.x, this.y, this.dx, this.dy);
  var j2 = j1;
  for (var j = this.joints.length-1; j >= 0; j--) {
    j2 = this.joints[j];
    var segmentLength = j1.distanceTo(j2);
    if (remainder >= segmentLength) {
      remainder -= segmentLength;
      segments.push(new Segment(j1.x, j1.y, j2.x, j2.y));
    } else {
      this.joints = this.joints.slice(j+1);
      break;
    }
    j1 = j2;
  }
  segments.push(new Segment(j1.x, j1.y, j1.x-j1.dx*remainder, j1.y-j1.dy*remainder));
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
Player.prototype.move = function(){
  if (this.snake)
    this.snake.move();
};

tapio.Serializer.registerType(SnakeEngine);
tapio.Serializer.registerType(Food);
tapio.Serializer.registerType(Joint);
tapio.Serializer.registerType(Segment);
tapio.Serializer.registerType(Snake);
tapio.Serializer.registerType(Player);

exports.SnakeEngine = SnakeEngine;
