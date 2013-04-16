var tapio = require('tap.io');

var app = new tapio.App();
app.addResource(new tapio.FileResource('/test.html', __dirname + '/test.html', 'text/html'));
app.start(8080, {random: new tapio.Random(3)});
