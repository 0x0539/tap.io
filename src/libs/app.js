var fs = require('fs');
var ejs = require('ejs');

var Network = require('./server.js').Network;
var Game = require('./server.js').Game;

var App = function(){
  this.sharedJs = null;
  this.clientJs = null;
  this.wrapperJs = null;
  this.network = null;
  this.game = null;
};
App.prototype.wrapJs = function(js){
  this.wrapperJs = this.wrapperJs || fs.readFileSync(__dirname + '/wrapper.js.ejs');
  return ejs.render(this.wrapperJs.toString(), {js: js});
};
App.prototype.start = function(server, engine){
  this.network = new Network(server);
  this.network.start();
  this.game = new Game(this.network, engine);
  this.game.start();
};
App.prototype.getSharedJs = function() {
  this.sharedJs = this.sharedJs || this.wrapJs(fs.readFileSync(__dirname + '/shared.js'));
  return this.sharedJs;
};
App.prototype.getClientJs = function() {
  this.clientJs = this.clientJs || this.wrapJs(fs.readFileSync(__dirname + '/client.js'));
  return this.clientJs;
};

exports.App = App;

var merge = function(into, from){
  for (var declaration in from) {
    if (declaration in into) {
      throw new Error('already declared: ' + declaration);
    } else {
      into[declaration] = from[declaration];
    }
  }
};

merge(exports, require('./shared.js'));
merge(exports, require('./server.js'));
