var assert = require('assert'),
    reload = require('./reload');

describe('Engine#calculateSafeAdvancePoint', function(){
  beforeEach(function(done){
    this.Engine = reload.reload('../lib/shared/engine.js').Engine;
    done();
  });

  it('should get the minimum safe zone', function(){
    var safeAdvancePoint = this.Engine.calculateSafeAdvancePoint({0: 15, 1: 20, 5: 2});
    assert.equal(safeAdvancePoint, 2);
  });

  it('should return null with an empty safe zone', function(){
    var safeAdvancePoint = this.Engine.calculateSafeAdvancePoint({});
    assert.equal(safeAdvancePoint, null);
  });
});
