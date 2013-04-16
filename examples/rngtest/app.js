var tapio = require('tap.io');

var app = new tapio.App();

var ejsScope = {scripts: []};
app.forAllResources(function(resource){
  if (resource instanceof tapio.JsResource)
    ejsScope.scripts.push(resource.name);
});

var testHtml = new tapio.FileResource('/test.html.raw', __dirname + '/test.html.ejs', 'text/html');
var testHtmlEjs = new tapio.EjsResource('/test.html', testHtml, ejsScope);

app.addResource(testHtml);
app.addResource(testHtmlEjs);

app.start(8080);
