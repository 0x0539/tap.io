exports.safelyAdvanceTests = {
  setUp: function(callback){
    this.Engine = require('../lib/shared/engine.js').Engine;
    this.Engine.calculateSafeZone = function(){ 
      return null; 
    };
    callback();
  },
  testCalculateSafeZoneCalled: function(test){
    test.expect(2);
    this.Engine.calculateSafeZone = function(state){
      test.deepEqual(state, {vt: 2});
      test.ok(true);
    };
    this.Engine.safelyAdvance({vt: 2});
    test.done();
  },
  testCalculateSafeAdvancePointCalled: function(test){
    test.expect(2);
    this.Engine.calculateSafeAdvancePoint = function(state){
      test.equal(state, null);
      test.ok(true);
    };
    this.Engine.safelyAdvance({vt: 3});
    test.done();
  },
  testSafelyAdvanceNotCalledWhenNoEventsAndNoSessions: function(test){
    this.Engine.calculateSafeAdvancePoint = function(){ return null; };

    // should not get called
    this.Engine.advanceTo = function(state, safeAdvancePoint){
      test.ok(false, 'advanceTo was called');
    };

    this.Engine.safelyAdvance({vt: 2});
    test.done();
  },
  testSafelyAdvanceNotCalledWhenCannotAdvance: function(test){
    this.Engine.calculateSafeAdvancePoint = function(){ return 2; };

    // should not get called
    this.Engine.advanceTo = function(state, safeAdvancePoint){
      test.ok(false, 'advanceTo was called');
    };

    this.Engine.safelyAdvance({vt: 2});
    test.done();
  },
  testSafelyAdvanceCalledWithCorrectAdvancePoint: function(test){
    test.expect(2);

    this.Engine.calculateSafeAdvancePoint = function(){ return 3; };

    // should get called with ({vt: 2}, 3)
    this.Engine.advanceTo = function(state, safeAdvancePoint){
      test.equal(state.vt, 2);
      test.equal(safeAdvancePoint, 3);
    };

    this.Engine.safelyAdvance({vt: 2});
    test.done();
  }

};
