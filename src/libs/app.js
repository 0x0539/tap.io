var fs = require('fs');
var ejs = require('ejs');
var server = require('./server.js');
var shared = require('./shared.js');

var FileResource = function(path, contentType){
  this.path = path;
  this.contentType = contentType;
  this.contents = fs.readFileSync(path);
};
FileResource.prototype.getContent = function(req){
  return this.contents;
};
FileResource.prototype.getContentType = function(req){
  return this.contentType || 'text/plain';
};

var DynamicResource = function(getContentCb, getContentTypeCb){
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

var JsResource = function(resource){
  this.resource = resource;
  this.template = new EjsResource(new FileResource(__dirname + '/wrapper.js.ejs'));
};
JsResource.prototype.getContent = function(req){
  this.template.ejsScope.script = this.resource.getContent(req);
  return this.template.getContent(req);
};
JsResource.prototype.getContentType = function(req){
  return 'text/javascript';
};

var EjsResource = function(resource, ejsScope){
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
  this.addResource('/tap/shared.js', new JsResource(new FileResource(__dirname + '/shared.js')));
  this.addResource('/tap/client.js', new JsResource(new FileResource(__dirname + '/client.js')));
};
App.prototype.getResource = function(name){
  return this.resourcesByName[name];
};
App.prototype.addResource = function(name, resource){
  if (name == null)
    throw new Error('resource name missing');
  if (name in this.resourcesByName)
    throw new Error('resource name already taken');
  this.resourcesByName[name] = resource;
  this.resourcesInOrder.push(resource);
};
App.prototype.forAllResources = function(callback){
  for (var i = 0; i < this.resourcesInOrder.length; i++)
    callback(this.resourcesInOrder[i]);
};
App.prototype.start = function(port, engine){
  var dis = this;

  var httpServer = require('http').createServer(function(req, res){
    dis.handle(req, res);
  });

  httpServer.listen(port);

  var network = new server.Network(httpServer);
  network.start();

  var game = new server.Game(network, engine);
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
exports.FileResource = FileResource;
exports.DynamicResource = DynamicResource;
exports.JsResource = JsResource;
exports.EjsResource = EjsResource;

var merge = function(into, from){
  for (var declaration in from) {
    if (declaration in into) {
      throw new Error('already declared: ' + declaration);
    } else {
      into[declaration] = from[declaration];
    }
  }
};

merge(exports, shared);
merge(exports, server);
