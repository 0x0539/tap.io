var HTTP = require('http'),
    URL = require('url'),
    FS = require('fs'),
    EJS = require('ejs');

var EjsParameters = {
  baseurl: 'http://localhost:7787',
  socketio: 'http://localhost:9585',
  scripts: [
    '/lib/shared/utilities.js',
    '/lib/shared/engine.js',
    '/lib/shared/parameters.js',
    '/lib/shared/snake-engine.js',
    '/lib/client/game.js',
    '/lib/client/renderer.js',
    '/lib/client/snake-renderer.js',
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
    throw new Error('route is of invalid type');
  }
};

var getRouteHandlerFor = function(path){
  for(var name in routes)
    if(testRoute(routes[name], path))
      return handlers[name];
  throw new Error('no available handler for ' + path);
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
      respondWith(response, 400, 'text/plain', 'requested path was not a file');
    }
  });
};

var handlers = {
  home: function(request, response){
    respondWithFile('./home.html.ejs', response, 'text/html', function(data){
      return EJS.render(data, EjsParameters);
    });
  },
  file: function(request, response){
    var url = URL.parse(request.url),
        path = url.pathname;
    respondWithFile('.' + path, response);
  }
};


var routes = {
  "home": /^\/$/,
  "file": [
    /^\/lib\/shared\/[a-zA-Z0-9_-]*\.js$/,
    /^\/lib\/client\/[a-zA-Z0-9_-]*\.js$/,
    "/favicon.ico"
  ],
};
var server = HTTP.createServer(function(request, response){
  try{
    getRouteHandlerFor(URL.parse(request.url).pathname)(request, response);
  }
  catch(error){
    respondWith(response, 500, 'text/plain', 'could not satisfy your request');
  }
});

server.listen(7787);
