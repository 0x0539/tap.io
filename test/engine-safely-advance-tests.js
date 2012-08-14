var assert = require('assert');

describe('Engine#safelyAdvance', function(){
  beforeEach(function(done){
    this.Engine = require('../lib/shared/engine.js').Engine;
    this.Engine.calculateSafeZone = function(){ return null; };
    this.Engine.calculateSafeAdvancePoint = function(){ return null; }
    done();
  });

  it('should call calculateSafeZone', function(){
    var called = 0;

    this.Engine.calculateSafeZone = function(state){
      assert.deepEqual(state, {vt: 2});
      called++;
    };

    this.Engine.safelyAdvance({vt: 2});

    assert.equal(called, 1);
  });

  it('should call calculateSafeAdvancePoint', function(){
    var called = 0;
    this.Engine.calculateSafeAdvancePoint = function(state){
      assert.equal(state, null);
      called++;
    };
    this.Engine.safelyAdvance({vt: 3});
    assert.equal(called, 1);
  });

  it('should not call advanceTo when safe advance point is null', function(){
    this.Engine.advanceTo = function(state, safeAdvancePoint){
      assert.ok(false);
    };
    this.Engine.safelyAdvance({vt: 2});
  });

  it('should not call advanceTo when safe advance point equals state vt', function(){
    this.Engine.calculateSafeAdvancePoint = function(){
      return 2;
    };
    this.Engine.advanceTo = function(state, safeAdvancePoint){
      assert.ok(false);
    };
    this.Engine.safelyAdvance({vt: 2});
  });

  it('should call advanceTo when safe advance point is greater than state vt', function(){
    var called = 0;
    this.Engine.calculateSafeAdvancePoint = function(){
      return 3;
    };
    this.Engine.advanceTo = function(state, safeAdvancePoint){
      assert.deepEqual(state, {vt: 2});
      assert.equal(safeAdvancePoint, 3);
      called++;
    };
    this.Engine.safelyAdvance({vt: 2});
    assert.equal(called, 1);
  });

});
