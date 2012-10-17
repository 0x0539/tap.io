var HTTP = require('http'),
    URL = require('url'),
    FS = require('fs'),
    EJS = require('ejs');

var Parameters = {
  scripts: [
    '/lib/shared/parameters.js',
    '/lib/shared/utilities.js',
    '/lib/shared/serializer.js',
    '/lib/shared/cloner.js',
    '/lib/shared/random.js',
    '/lib/shared/engine.js',
    '/lib/shared/freed/vector3.js',
    '/lib/shared/freed/cache.js',
    '/lib/shared/freed/plane.js',
    '/lib/shared/freed/face3.js',
    '/lib/shared/freed/sphere.js',
    '/lib/shared/freed/geometry.js',
    '/lib/shared/freed/facebucket.js',
    '/lib/shared/freed/freed.js',
    '/lib/vendor/three.min.js',
    '/lib/vendor/jquery-1.8.2.min.js',
    '/lib/client/raf.js',
    '/lib/client/game.js',
    '/lib/client/render-loop.js',
    '/example/snake/shared/snake-engine.js',
    '/example/snake/client/snake-renderer.js',
  ]
};

var testRoute = function(route, path){
  if(route instanceof RegExp){
    return route.test(path);
  }
  else if(typeof route == 'string'){
    return route == path;
  }
  else if(route instanceof Array){
    for(var i = 0; i < route.length; i++)
      if(testRoute(route[i], path))
        return true;
  }
  else{
    throw new Error('misconfigured route: ' + route);
  }
};

var getRouteHandlerFor = function(path){
  for(var name in routes)
    if(testRoute(routes[name], path))
      return handlers[name];
  throw new Error('unroutable request: ' + path);
};

var respondWith = function(response, status, contentType, data){
  response.writeHead(status, {'Content-Type': contentType});
  if(data != null)
    response.write(data);
  response.end();
};

var respondWithFile = function(path, response, contentType, map){
  FS.stat(path, function(error, stat){

    if(error != null){
      respondWith(response, 500, 'text/plain', 'could not stat file: ' + error.toString());
    }
    else if(stat.isFile()){
      FS.readFile(path, 'utf8', function(error, data){
        if(error != null)
          respondWith(response, 500, 'text/plain', 'could not read file: ' + error.toString());
        else{
          data = map == null ? data : map(data);
          respondWith(response, 200, contentType, data);
        }
      });
    }
    else{
      respondWith(response, 404, 'text/plain', 'Error: ' + path + ' is not a file');
    }
  });
};

var handlers = {
  snake: function(request, response){
    respondWithFile('./example/snake/client/snake.html.ejs', response, 'text/html', function(data){
      return EJS.render(data, Parameters);
    });
  },
  jsfile: function(request, response){
    var url = URL.parse(request.url),
        path = url.pathname;
    respondWithFile('.' + path, response, 'text/javascript');
  }
};


var routes = {
  snake: "/",
  jsfile: Parameters.scripts
};

var server = HTTP.createServer(function(request, response){
  try{
    var handler = getRouteHandlerFor(URL.parse(request.url).pathname);
  }
  catch(error){
    respondWith(response, 404, 'text/plain', error.toString());
  }

  try{
    handler(request, response);
  }
  catch(error){
    respondWith(response, 500, 'text/plain', error.toString());
  }
});

server.listen(80);

global.window = false;

// server-only dependencies
var Network = require('../../../lib/server/network.js').Network,
    Game = require('../../../lib/server/game.js').Game,
    Engine = require('../../../lib/shared/engine.js').Engine,
    FREED = require('../../../lib/shared/freed/freed.js').FREED,
    SnakeEngine = require('../shared/snake-engine.js').SnakeEngine;

// plug in game engine
Engine.plugins.push(SnakeEngine);

// start the networking
var socket = new Network(server);
socket.start();

// start the game manager
var game = new Game(socket);

game.state.terrain = FREED.Geometry();

var cols = 30, rows = 30, scale = 30;
for(var i = 0; i < cols; i++){
  for(var j = 0; j < rows; j++){
    var z1 = scale*Math.sin(Math.sqrt(i*i + j*j)),
        z2 = 2*scale*Math.sin(Math.sqrt((rows-i)*(rows-i) + j*j));
    game.state.terrain.vertices.push(FREED.Vector3(i*scale, j*scale, z1 + z2));
  }
}

game.state.terrain.minX = 0;
game.state.terrain.maxX = (cols-1)*scale;
game.state.terrain.minY = 0;
game.state.terrain.maxY = (rows-1)*scale;

for(var i = 0; i < cols - 1; i++){
  for(var j = 0; j < rows - 1; j++){
    var v = i*rows + j,
        f1 = FREED.Face3(v, v+rows+1, v+1, game.state.terrain),
        f2 = FREED.Face3(v, v+rows, v+rows+1, game.state.terrain);
    game.state.terrain.faces.push(f1);
    game.state.terrain.faces.push(f2);
  }
}

game.start();
