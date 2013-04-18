var tapio = typeof window == 'undefined' ? require('tap.io') : window.tapio;

var Extension = function() {
  tapio.Serializer.registerInstance(this, Extension);
  // Configure initial shared state with a random number generator.
  this.random = new tapio.Random(3);
};

Extension.prototype.update = function(state) {
  if(state.vt % 100 == 0)
    console.log(state.vt + ': ' + this.random.random());
};

Extension.prototype.validate = function(state, event) { };
Extension.prototype.handle = function(state, event) { };

tapio.Serializer.registerType(Extension);

exports.RngExtension = Extension;
