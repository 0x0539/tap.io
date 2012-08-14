var Engine = require('../lib/shared/engine.js').Engine;

exports.safeZoneTests = {
  testSafeZoneInitializing: function(test){
    var state = { 
      vt: 20,
      sessionIds: [1, 3], 
      events: []
    };

    var safeZone = Engine.calculateSafeZone(state);

    test.ok(safeZone.hasOwnProperty(1));
    test.ok(safeZone.hasOwnProperty(3));
    test.equal(safeZone[1], 20);
    test.equal(safeZone[3], 20);
    test.done();
  },
  testSafeZoneRemovesDisconnects: function(test){
    var state = {
      vt: 10,
      sessionIds: [1, 3],
      events: [
        {type: 'disconnect', data: {sessionId: 3}, vt: 20}
      ]
    };

    var safeZone = Engine.calculateSafeZone(state);

    test.ok(safeZone.hasOwnProperty(1));
    test.ok(!safeZone.hasOwnProperty(3));
    test.equal(safeZone[1], 10);
    test.done();
  },
  testSafeZoneChoosesMaxEventVt: function(test){
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

    var safeZone = Engine.calculateSafeZone(state);

    test.ok(safeZone.hasOwnProperty(2));
    test.ok(safeZone.hasOwnProperty(4));
    test.equal(safeZone[2], 30);
    test.equal(safeZone[4], 25);
    test.done();
  },
  testSafeZoneAddsUserOnConnectEvents: function(test){
    var state = {
      vt: 10,
      sessionIds: [2],
      events: [
        {type: 'gameevent', senderSessionId: 2, vt: 21},
        {type: 'connect', data: {sessionId: 4}, vt: 22}
      ]
    };

    var safeZone = Engine.calculateSafeZone(state);

    test.ok(safeZone.hasOwnProperty(2));
    test.ok(safeZone.hasOwnProperty(4));
    test.equal(safeZone[2], 21);
    test.equal(safeZone[4], 22);
    test.done();
  }
};

exports.safeAdvancePointTests = {


};
