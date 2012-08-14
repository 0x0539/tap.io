var assert = require('assert');

describe('Engine#advanceTo', function(){
  beforeEach(function(done){
    this.Engine = require('../lib/shared/engine.js').Engine;
    done();
  });

  it('should call plugins at every vt', function(){
    var state = {vt: 1, events: []},
        vtCounter = state.vt, 
        called = 0;

    this.Engine.plugins.push({
      update: function(state){
        assert.equal(state.vt, vtCounter++);
        called++;
      }
    });

    this.Engine.advanceTo(state, 4);

    assert.equal(called, 3);
  });
});
