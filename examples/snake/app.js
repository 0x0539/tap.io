var tapio = require('tap.io');
var snake = require('./snake.js');

var app = new tapio.App();

// Configure the client HTML page for serving.
var indexHtmlResource = new tapio.FileResource(__dirname + '/index.html', 'text/html');
// Configure the snake JS for serving.
var snakeJsResource = new tapio.JsResource(new tapio.FileResource(__dirname + '/snake.js'));

app.addResource('/', indexHtmlResource);
app.addResource('/snake.js', snakeJsResource);

app.start(8080, new snake.SnakeEngine());
