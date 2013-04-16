var tapio = require('tap.io');

var Engine = function(){};
Engine.prototype.update = function(){};
Engine.prototype.handle = function(){};
Engine.prototype.validate = function(){};

var app = new tapio.App();
app.addResource(new FileResource('/test.html', './test.html', 'text/html'));
app.start(8080, {}, new Engine());
