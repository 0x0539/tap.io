var fs = require('fs');
var ejs = require('ejs');

var Network = require('./server.js').Network;
var Game = require('./server.js').Game;

var App = function(){
  this.wrapperJs = fs.readFileSync(__dirname + '/wrapper.js.ejs');

  this.tapJs = [
    this.wrapJs(fs.readFileSync(__dirname + '/shared.js')),
    this.wrapJs(fs.readFileSync(__dirname + '/client.js'))
  ].join('\n\n');

  this.network = null;
  this.game = null;
};
App.prototype.start = function(server, engine){
  this.network = new Network(server);
  this.network.start();
  this.game = new Game(this.network, engine);
  this.game.start();
};
App.prototype.wrapJs = function(js){
  return ejs.render(this.wrapperJs.toString(), {js: js});
};
App.prototype.getTapJs = function() {
  return this.tapJs;
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
