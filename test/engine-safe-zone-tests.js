var assert = require('assert');

describe('Engine#calculateSafeZone', function(){
  beforeEach(function(done){
    this.Engine = require('../lib/shared/engine.js').Engine;
    done();
  });

  it('should initialize the safe zone for every session id', function(){
    var state = {
      vt: 20, 
      sessionIds: [1, 3], 
      events: []
    };

    var safeZone = this.Engine.calculateSafeZone(state);

    assert.ok(safeZone.hasOwnProperty(1));
    assert.ok(safeZone.hasOwnProperty(3));
    assert.equal(safeZone[1], 20);
    assert.equal(safeZone[3], 20);
  });

  it('should remove disconnects', function(){
    var state = {
      vt: 10,
      sessionIds: [1, 3],
      events: [
        {type: 'disconnect', data: {sessionId: 3}, vt: 20}
      ]
    };

    var safeZone = this.Engine.calculateSafeZone(state);

    assert.ok(safeZone.hasOwnProperty(1));
    assert.ok(!safeZone.hasOwnProperty(3));
    assert.equal(safeZone[1], 10);
  });

  it('should choose the max event vt for every session', function(){
    var state = {
      vt: 10,
      sessionIds: [2, 4],
      events: [
        {type: 'gameevent', senderSessionId: 2, vt: 12},
        {type: 'gameevent', senderSessionId: 2, vt: 21},
        {type: 'gameevent', senderSessionId: 4, vt: 21},
        {type: 'gameevent', senderSessionId: 4, vt: 25},
        {type: 'gameevent', senderSessionId: 2, vt: 30}
      ]
    };

    var safeZone = this.Engine.calculateSafeZone(state);

    assert.ok(safeZone.hasOwnProperty(2));
    assert.ok(safeZone.hasOwnProperty(4));
    assert.equal(safeZone[2], 30);
    assert.equal(safeZone[4], 25);
  });

  it('should add users to safe zone when a connect event is received', function(){
    var state = {
      vt: 10,
      sessionIds: [2],
      events: [
        {type: 'gameevent', senderSessionId: 2, vt: 21},
        {type: 'connect', data: {sessionId: 4}, vt: 22}
      ]
    };

    var safeZone = this.Engine.calculateSafeZone(state);

    assert.ok(safeZone.hasOwnProperty(2));
    assert.ok(safeZone.hasOwnProperty(4));
    assert.equal(safeZone[2], 21);
    assert.equal(safeZone[4], 22);
  });
});
