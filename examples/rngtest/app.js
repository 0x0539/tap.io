var tapio = require('tap.io');

var app = new tapio.App();

// Configure the client HTML page for serving.
var indexHtmlResource = new tapio.FileResource(__dirname + '/index.html', 'text/html');
// Configure the extension JS for serving.
var extensionJsResource = new tapio.JsResource(new tapio.FileResource(__dirname + '/extension.js'));

// Configure initial shared state with a random number generator.
var state = {random: new tapio.Random(3)};

app.addResource('/', indexHtmlResource);
app.addResource('/extension.js', extensionJsResource);

var MinimalExtension = require('./extension.js').MinimalExtension;

app.start(8080, state, new MinimalExtension());
