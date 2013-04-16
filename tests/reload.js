var path = require('path');

exports.reload = function(value){
  var resolved = path.resolve(__dirname, value);
  delete require.cache[resolved];
  return require(value);
};
