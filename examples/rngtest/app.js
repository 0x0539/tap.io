// Create the tap.io app instance.
var tapio = require('tap.io');
var app = new tapio.App();

// Read the files we need to serve.
var fs = require('fs');
var extensionJs = app.wrapJs(fs.readFileSync(__dirname + '/extension.js'));

// Set up express server.
var express = require('express')();
express.get('/tap.js', function(req, res){ res.set('Content-Type', 'text/javascript'); res.send(app.getTapJs()); });
express.get('/', function(req, res){ res.sendfile(__dirname + '/index.html'); });
express.get('/extension.js', function(req, res){ res.set('Content-Type', 'text/javascript'); res.send(extensionJs); });

// Set up HTTP server.
var server = require('http').createServer(express);
server.listen(8080);

// Set up game engine.
var extension = require('./extension.js');
var engine = new extension.RngExtension();

// Start server.
app.start(server, engine);
