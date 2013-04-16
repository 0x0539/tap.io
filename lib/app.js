var fs = require('fs');
var ejs = require('ejs');
var server = require('./server.js');

var FileResource = function(name, path){
  this.name = name;
  this.path = path;
  this.contents = fs.readFileSync(path);
};
FileResource.prototype.getContent = function(req){
  return this.contents;
};

var DynamicResource = function(name, callback){
  this.name = name;
  this.callback = callback;
};
DynamicResource.prototype.getContent = function(req){
  return this.callback(req);
};

var JsResource = function(name, resource){
  this.name = name;
  this.resource = resource;
  this.prefix = 'window.tap = window.tap || {};\n(function(exports){\n';
  this.suffix = '\n})(window.tap);';
};
JsResource.prototype.getContent = function(req){
  return this.prefix + this.resource.getContent(req) + this.suffix;
};

var EjsResource = function(name, resource, ejsScope){
  this.name = name;
  this.resource = resource;
  this.ejsScope = ejsScope || {};
};
EjsResource.prototype.getContent = function(req){
  var ejsScope = {};
  for (var key in this.ejsScope) {
    ejsScope[key] = this.ejsScope[key];
  }
  var url = require('url').parse(req, true, true);
  for (var key in url.query) {
    ejsScope[key] = url.query[key];
  }
  return ejs.render(this.resource.getContent(req), ejsScope);
};

var App = function(){
  this.resourcesByName = {};
  this.resourcesInOrder = [];
  this.addResource(new FileResource('/tap/client.js', './client.js'));
};
App.prototype.getResource = function(name){
  return this.resourcesByName[name];
};
App.prototype.addResource = function(resource){
  if (resource.name == null)
    throw new Error('resource name missing');
  this.resourcesByName[resource.name] = resource;
  this.resourcesInOrder.push(resource);
};
App.prototype.forAllResources = function(callback){
  for (var i = 0; i < this.resourcesInOrder.length; i++)
    callback(this.resourcesInOrder[i]);
};
App.prototype.start = function(port){
  var dis = this;

  var httpServer = require('http').createServer(function(req, res){
    dis.handle(req, res);
  });

  httpServer.listen(port);

  var network = new server.Network(httpServer);
  network.start();

  var game = new server.Game(network);
  game.start();
};
App.prototype.handle = function(req, res){
  var url = require('url').parse(req.url);
  var resource = this.getResource(url.pathname);
  if (resource) {
    res.writeHead(200, {'Content-Type': 'text/javascript'});
    res.write(resource.getContent(req));
    res.end();
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('no such resource found');
    res.end();
  }
};

exports.App = App;
exports.DynamicResource = DynamicResource;
exports.FileResource = FileResource;
exports.JsResource = JsResource;
exports.EjsResource = EjsResource;
