var Engine = require('../lib/shared/engine.js').Engine;

exports.safeAdvancePointTests = {
  testGetsMinimumSafeZone: function(test){
    var safeZone = {
      0: 15,
      1: 20,
      5: 2 
    };

    var safeAdvancePoint = Engine.calculateSafeAdvancePoint(safeZone);

    test.equal(safeAdvancePoint, 2);
    test.done();
  },
  testReturnsNullOnEmptySafeZone: function(test){
    var safeZone = {};

    var safeAdvancePoint = Engine.calculateSafeAdvancePoint(safeZone);

    test.equal(safeAdvancePoint, null);
    test.done();
  }
};
