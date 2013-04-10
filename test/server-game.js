var assert = require('assert'),
    reload = require('./reload.js'),
    Utilities = require('../lib/shared/utilities.js').Utilities,
    Parameters = require('../lib/shared/parameters.js').Parameters,
    Serializer = require('../lib/shared/serializer.js').Serializer,
    Events = require('../lib/shared/constants.js').Constants.Events;

describe('server/Game', function(){

  var buildNetworkMock = function(){
    return {
      on: function(type, callback){
        this.eventCallbacks = this.eventCallbacks || {};
        this.eventCallbacks[type] = callback;
      },
      send: function(){},
      broadcast: function(){}
    };
  };

  beforeEach(function(done){
    this.Game = reload.reload('../lib/server/game.js').Game;
    done();
  });

  it('should construct without exceptions using the base network mock', function(){
    var game = new this.Game(buildNetworkMock());
    assert.equal(game.state.clock, 0);
    assert.equal(game.state.vt, 0);
    assert.deepEqual(game.state.events, []);
    assert.deepEqual(game.state.sessionIds, [0]);
    assert.notEqual(game.state.arc4, null);
  });

  it('should not allow an empty or null network', function(){
    assert.throws(function(){
      new this.Game();
    });
    assert.throws(function(){
      new this.Game(null);
    });
  });

  it('should register with low level network events on construction', function(){
    var network = buildNetworkMock(),
        eventTypes = {};

    eventTypes['tap.io'] = true;
    eventTypes['disconnect'] = true;
    eventTypes['connect'] = true;

    network.on = function(eventType, callback){
      assert.ok(eventTypes.hasOwnProperty(eventType));
      delete eventTypes[eventType];
      assert.equal(typeof callback, 'function');
    };

    new this.Game(network);

    assert.deepEqual({}, eventTypes);
  });

  describe('with state passed in', function(){
    var buildBaseState = function(){
      return {
        vt: 3,
        events: [{a: 2}, {b: 3}],
        clock: 5,
        sessionIds: [0, 1, 2],
        arc4: {}
      };
    };

    it('should have a valid base test', function(){
      var baseState = buildBaseState(),
          game = new this.Game(buildNetworkMock(), baseState);

      // we just want to show that the data object itself is used, knowing it may be modified
      assert.deepEqual(game.state, baseState);
    });

    it('should raise an error if vt is undefined', function(){
      var baseState = buildBaseState(),
          dis = this;

      baseState.vt = null;

      assert.throws(function(){
        new dis.Game(buildNetworkMock(), baseState);
      });
    });

    it('should raise an error if events is undefined', function(){
      var baseState = buildBaseState(),
          dis = this;

      baseState.events = null;

      assert.throws(function(){
        new dis.Game(buildNetworkMock(), baseState);
      });
    });

    it('should raise an error if clock is undefined', function(){
      var baseState = buildBaseState(),
          dis = this;

      baseState.clock = null;

      assert.throws(function(){
        new dis.Game(buildNetworkMock(), baseState);
      });
    });

    it('should raise an error if clock is undefined', function(){
      var baseState = buildBaseState(),
          dis = this;

      baseState.sessionIds = null;

      assert.throws(function(){
        new dis.Game(buildNetworkMock(), baseState);
      });
    });

    it('should raise an error if arc4 is undefined', function(){
      var baseState = buildBaseState(),
          dis = this;

      baseState.arc4 = null;

      assert.throws(function(){
        new dis.Game(buildNetworkMock(), baseState);
      });
    });

    it('should add endSession events for all nonzero users', function(){
      var baseState = buildBaseState();

      assert.equal(baseState.events.length, 2);

      var game = new this.Game(buildNetworkMock(), baseState);

      assert.equal(baseState.events.length, 4);
      assert.deepEqual(baseState.events[2], {type: Events.CONNECTION_LOST, senderSessionId: 0, data: {sessionId: 1}, vt: game.state.clock});
      assert.deepEqual(baseState.events[3], {type: Events.CONNECTION_LOST, senderSessionId: 0, data: {sessionId: 2}, vt: game.state.clock});
    });
  });

  describe('#loop', function(){
    it('should increment the virtual clock by at least 1', function(){
      var game = new this.Game(buildNetworkMock()),
          clock = game.state.clock;

      game.nextIteration = Date.now() - game.Parameters.vtPeriodInMillis * 2;

      game.loop();

      assert.ok(game.state.clock > clock);
    });

  });

  describe('#start', function(){
    it('should create a heartbeat interval', function(){
      var game = new this.Game(buildNetworkMock());
      assert.equal(typeof game.heartbeatInterval, 'undefined');
      game.start();
      assert.equal(typeof game.heartbeatInterval, 'object');
      clearInterval(game.heartbeatInterval);
    });

    it('should create a loop interval', function(){
      var game = new this.Game(buildNetworkMock());
      assert.equal(typeof game.gameLoopInterval, 'undefined');
      game.start();
      assert.equal(typeof game.gameLoopInterval, 'object');
      clearInterval(game.gameLoopInterval);
    });

    it('should create a compact interval', function(){
      var game = new this.Game(buildNetworkMock());
      assert.equal(typeof game.gameCompactInterval, 'undefined');
      game.start();
      assert.equal(typeof game.gameCompactInterval, 'object');
      clearInterval(game.gameCompactInterval);
    });

    it('should complain if Parameters.vtPeriodInMillis is undefined', function(){
      var game = new this.Game(buildNetworkMock());
      game.Parameters = {};
      assert.throws(function(){
        game.start();
      });
    });

    it('should complain if Parameters.vtPeriodInMillis is not a number', function(){
      var game = new this.Game(buildNetworkMock());
      game.Parameters = {vtPeriodInMillis: 'abc'};
      assert.throws(function(){
        game.start();
      });
    });
  });

  describe('#fire', function(){
    it('should push an event onto state.events and broadcast that event', function(){
      var network = buildNetworkMock(),
          game = new this.Game(network),
          event = {
            type: Events.EMPTY,
            data: 'gabbl',
            senderSessionId: 3,
            vt: game.state.clock
          },
          called = 0;

      network.broadcast = function(inEvent){
        assert.deepEqual(event, inEvent);
        called++;
      };

      assert.equal(game.state.events.length, 0);

      game.fireEvent(event);

      assert.equal(game.state.events.length, 1);
      assert.deepEqual(game.state.events[0], event);
      assert.equal(called, 1);
    });
  });

});
