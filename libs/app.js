var fs = require('fs');
var ejs = require('ejs');
var server = require('./server.js');
var shared = require('./shared.js');

var FileResource = function(name, path, contentType){
  this.name = name;
  this.path = path;
  this.contents = fs.readFileSync(path);
  this.contentType = contentType || 'text/plain';
};
FileResource.prototype.getContent = function(req){
  return this.contents;
};
FileResource.prototype.getContentType = function(req){
  return this.contentType;
};

var DynamicResource = function(name, getContentCb, getContentTypeCb){
  this.name = name;
  this.getContentCb = getContentCb;
  this.getContentTypeCb = getContentTypeCb;
};
DynamicResource.prototype.getContent = function(req){
  if (typeof this.getContentCb == 'function')
    return this.getContentCb(req);
  throw new Error('illegal content callback for ' + this.name);
};
DynamicResource.prototype.getContentType = function(req){
  if (this.getContentTypeCb == null)
    return 'text/plain';
  if (typeof this.getContentTypeCb == 'function')
    return this.getContentTypeCb(req);
  throw new Error('illegal content type callback for ' + this.name);
};

var JsResource = function(name, resource){
  this.name = name;
  this.resource = resource;
  this.prefix = 'window.tapio = window.tapio || {};\n(function(exports){\n\n';
  this.suffix = '\n\n})(window.tapio);';
};
JsResource.prototype.getContent = function(req){
  return this.prefix + this.resource.getContent(req) + this.suffix;
};
JsResource.prototype.getContentType = function(req){
  return 'text/javascript';
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
  var url = require('url').parse(req.url, true, true);
  for (var key in url.query) {
    ejsScope[key] = url.query[key];
  }
  return ejs.render(this.resource.getContent(req).toString(), ejsScope);
};
EjsResource.prototype.getContentType = function(req){
  return this.resource.getContentType(req);
};

var App = function(){
  this.resourcesByName = {};
  this.resourcesInOrder = [];
  this.addResource(new JsResource('/tap/shared.js', new FileResource('', __dirname + '/shared.js')));
  this.addResource(new JsResource('/tap/client.js', new FileResource('', __dirname + '/client.js')));
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
App.prototype.start = function(port, state, engine){
  var dis = this;

  var httpServer = require('http').createServer(function(req, res){
    dis.handle(req, res);
  });

  httpServer.listen(port);

  if (engine != null)
    shared.Engine.plugins = [engine];

  var network = new server.Network(httpServer);
  network.start();

  var game = new server.Game(network, state);
  game.start();

  return game;
};
App.prototype.handle = function(req, res){
  var url = require('url').parse(req.url);
  var resource = this.getResource(url.pathname);
  if (resource) {
    res.writeHead(200, {'Content-Type': resource.getContentType(req)});
    res.write(resource.getContent(req));
    res.end();
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write(url.pathname + ': resource not found');
    res.end();
  }
};

exports.App = App;
exports.Random = shared.Random;
exports.FileResource = FileResource;
exports.DynamicResource = DynamicResource;
exports.JsResource = JsResource;
exports.EjsResource = EjsResource;
