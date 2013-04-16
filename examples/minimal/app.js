var tapio = require('tap.io');

var Engine = function(){};
Engine.prototype.update = function(){};
Engine.prototype.handle = function(){};
Engine.prototype.validate = function(){};

var testHtml = new tapio.FileResource('/test.html', __dirname + '/test.html.ejs', 'text/html'),
    testHtmlEjs = new tapio.EjsResource('/test.html.ejs', testHtml);

var app = new tapio.App();
app.addResource(testHtml);
app.addResource(testHtmlEjs);
app.start(8080, {}, new Engine());
