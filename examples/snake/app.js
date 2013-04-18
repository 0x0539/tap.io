// Create the tap.io app instance.
var tapio = require('tap.io');
var app = new tapio.App();

// Read the files we need to serve.
var fs = require('fs');
var snakeJs = app.wrapJs(fs.readFileSync(__dirname + '/snake.js'));

// Set up express server.
var express = require('express')();
express.get('/shared.js', function(req, res){ res.set('Content-Type', 'text/javascript'); res.send(app.getSharedJs()); });
express.get('/client.js', function(req, res){ res.set('Content-Type', 'text/javascript'); res.send(app.getClientJs()); });
express.get('/',          function(req, res){ res.sendfile(__dirname + '/index.html'); });
express.get('/snake.js',  function(req, res){ res.set('Content-Type', 'text/javascript'); res.send(snakeJs); });

// Set up HTTP server.
var server = require('http').createServer(express);
server.listen(8080);

// Set up game engine.
var snake = require('./snake.js');
var engine = new snake.SnakeEngine();

// Start server
app.start(server, engine);
