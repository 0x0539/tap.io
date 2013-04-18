var tapio = typeof window == 'undefined' ? require('tap.io') : window.tapio;

var FOOD_COUNT = 5;

var SNAKE_GROWTH_RATE = 10;
var SNAKE_START_LENGTH = 50;
var SNAKE_SPEED = 1;
var SNAKE_WIDTH = 3;
var FOOD_RADIUS = 3;

var MIN_X = 0;
var MAX_X = 500;
var MIN_Y = 0;
var MAX_Y = 500;

var SnakeParameters = {};
SnakeParameters.SNAKE_WIDTH = SNAKE_WIDTH;
SnakeParameters.FOOD_RADIUS = FOOD_RADIUS;
SnakeParameters.MIN_X = MIN_X;
SnakeParameters.MAX_X = MAX_X;
SnakeParameters.MIN_Y = MIN_Y;
SnakeParameters.MAX_Y = MAX_Y;

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
  for(var sessionId1 in this.players){
    var player1 = this.players[sessionId1];
    for(var sessionId2 in this.players){
      var player2 = this.players[sessionId2];
      if(player1.isCollidingWithPlayer(player2)){
        player1.markForDeath();
      }
    }
  }
  for(var sessionId in this.players){
    var player = this.players[sessionId];
    if(player.isMarkedForDeath()){
      player.die();
    }
  }
  for(var f = 0; f < this.food.length; f++){
    var food = this.food[f];
    for(var sessionId in this.players){
      var player = this.players[sessionId];
      if(player.isCollidingWithFood(food)) {
        player.feed(food);
        this.food[f] = new Food(this.randomX(), this.randomY());
        break;
      }
    }
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
Segment.prototype.minX = function(){
  return Math.min(this.x1, this.x2);
};
Segment.prototype.maxX = function(){
  return Math.max(this.x1, this.x2);
};
Segment.prototype.minY = function(){
  return Math.min(this.y1, this.y2);
};
Segment.prototype.maxY = function(){
  return Math.max(this.y1, this.y2);
};
Segment.prototype.overlaps = function(other, margin){
  if(margin == null) 
    margin = 0;
  if(this.maxX() + margin < other.minX())
    return false;
  if(this.minX() - margin > other.maxX())
    return false;
  if(this.maxY() + margin < other.minY())
    return false;
  if(this.minY() - margin > other.maxY())
    return false;
  return true;
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
Snake.prototype.feed = function(food) {
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
Snake.prototype.isCollidingWithSnake = function(other){
  var head = new Segment(this.x, this.y, this.x, this.y);

  var segments = other.getSegments();

  if (this == other) {
    segments = segments.slice(2);
  }

  for (var i = 0; i < segments.length; i++){
    var segment = segments[i];
    if (segment.overlaps(head, SNAKE_WIDTH * 2)) {
      return true;
    }
  }
  return false;
};
Snake.prototype.isCollidingWithFood = function(food){
  var distance = Math.sqrt(Math.pow(food.x - this.x, 2) + Math.pow(food.y - this.y, 2));
  return distance <= FOOD_RADIUS + SNAKE_WIDTH;
};

var Player = function() {
  tapio.Serializer.registerInstance(this, Player);
  this.snake = null;
  this.markedForDeath = false;
};
Player.prototype.turn = function(dx, dy){
  if (this.snake) 
    this.snake.turn(dx, dy);
};
Player.prototype.respawn = function(snake){
  if (this.snake == null)
    this.snake = snake;
};
Player.prototype.markForDeath = function(){
  this.markedForDeath = true;
};
Player.prototype.isMarkedForDeath = function(){
  return this.markedForDeath;
};
Player.prototype.die = function(){
  this.snake = null;
  this.markedForDeath = false;
};
Player.prototype.isDead = function(){
  return this.snake == null;
};
Player.prototype.move = function(){
  if (this.snake)
    this.snake.move();
};
Player.prototype.isCollidingWithPlayer = function(other){
  if (this.snake && other.snake)
    return this.snake.isCollidingWithSnake(other.snake);
  return false;
};
Player.prototype.isCollidingWithFood = function(food){
  if (this.snake)
    return this.snake.isCollidingWithFood(food);
  return false;
};
Player.prototype.feed = function(food){
  if (this.snake)
    this.snake.feed(food);
};

tapio.Serializer.registerType(SnakeEngine);
tapio.Serializer.registerType(Food);
tapio.Serializer.registerType(Joint);
tapio.Serializer.registerType(Segment);
tapio.Serializer.registerType(Snake);
tapio.Serializer.registerType(Player);

exports.SnakeEngine = SnakeEngine;
exports.SnakeParameters = SnakeParameters;
