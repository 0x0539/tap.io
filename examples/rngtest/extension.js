var Extension = function() {};

Extension.prototype.update = function(state) {
  if(state.vt % 100 == 0)
    console.log(state.vt + ': ' + state.random.random());
};

Extension.prototype.validate = function(state, event) { };
Extension.prototype.handle = function(state, event) { };

exports.MinimalExtension = Extension;
