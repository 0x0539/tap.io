var tapio = require('tap.io');

var app = new tapio.App();

// Configure the client HTML page for serving.
var indexHtmlResource = new tapio.FileResource(__dirname + '/index.html', 'text/html');
// Configure the extension JS for serving.
var extensionJsResource = new tapio.JsResource(new tapio.FileResource(__dirname + '/extension.js'));

app.addResource('/', indexHtmlResource);
app.addResource('/extension.js', extensionJsResource);

var extension = require('./extension.js');

console.log(new extension.RngExtension());

app.start(8080, new extension.RngExtension());
