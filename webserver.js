var HTTP = require('http'),
    URL = require('url'),
    FS = require('fs'),
    EJS = require('ejs');

var Parameters = {
  baseurl: 'http://localhost:7787',
  socketio: 'http://localhost:9585',
  scripts: [
    '/lib/shared/utilities.js',
    '/lib/shared/engine.js',
    '/lib/shared/parameters.js',
    '/example/snake/shared/snake-engine.js',
    '/example/snake/client/snake-renderer.js',
    '/lib/vendor/three.min.js',
    '/lib/client/raf.js',
    '/lib/client/game.js',
    '/lib/client/render-loop.js',
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
      respondWith(response, 500, 'text/plain', error.toString());
    }
    else if(stat.isFile()){
      FS.readFile(path, 'utf8', function(error, data){
        if(error != null)
          respondWith(response, 500, 'text/plain', error.toString());
        else{
          data = map == null ? data : map(data);
          respondWith(response, 200, contentType, data);
        }
      });
    }
    else{
      respondWith(response, 404, 'text/plain', 'Error: resource is not a file');
    }
  });
};

var handlers = {
  snake: function(request, response){
    respondWithFile('./example/snake/client/home.html.ejs', response, 'text/html', function(data){
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

server.listen(7787);
