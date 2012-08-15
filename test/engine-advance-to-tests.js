var assert = require('assert'),
    reload = require('./reload');

describe('Engine#advanceTo', function(){
  beforeEach(function(done){
    this.Engine = reload.reload('../lib/shared/engine.js').Engine;
    done();
  });

  it('should call update on every plugin at every vt', function(){
    var state = {vt: 1, events: []},
        vts1 = [1, 2, 3],
        vts2 = [1, 2, 3];

    this.Engine.plugins.push({
      update: function(state){
        assert.equal(vts1.shift(), state.vt);
      }
    });

    this.Engine.plugins.push({
      update: function(state){
        assert.equal(vts2.shift(), state.vt);
      }
    });

    this.Engine.advanceTo(state, 4);

    assert.deepEqual(vts1, []);
    assert.deepEqual(vts2, []);
  });

  it('should increment the vt to up to endVt', function(){
    var state = {vt: 1, events: []};
    this.Engine.advanceTo(state, 5);
    assert.equal(state.vt, 5);
  });

  it('should call handle with every event up to the vt', function(){
    var state = {vt: 1, events: [
      {vt: 1},
      {vt: 2},
      {vt: 2},
      {vt: 5}
    ]};

    var callVts = [1, 2, 2];

    this.Engine.handle = function(state, event){
      assert.equal(state.events.length, callVts.length);
      assert.equal(state.vt, event.vt);
      assert.equal(event.vt, callVts.shift());
    };

    this.Engine.advanceTo(state, 5);

    assert.equal(state.events.length, 1);
    assert.equal(state.events[0].vt, 5);
    assert.equal(state.vt, 5);

    assert.deepEqual(callVts, []);
  });

});
