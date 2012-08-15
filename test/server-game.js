var assert = require('assert'),
    reload = require('./reload.js');

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
    assert.deepEqual(game.state, {
      clock: 0,
      vt: 0,
      events: [],
      sessionIds: [0]
    });
  });

  it('should not allow an empty or null network', function(){
    assert.throws(function(){
      new this.Game();
    });
    assert.throws(function(){
      new this.Game(null);
    });
  });

  it('should register with all network events on construction', function(){
    var network = buildNetworkMock(),
        eventTypes = {startSession: true, endSession: true, gameevent: true, heartbeat: true};

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
        sessionIds: [0, 1, 2]
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

    it('should add endSession events for all nonzero users', function(){
      var baseState = buildBaseState();

      assert.equal(baseState.events.length, 2);

      var game = new this.Game(buildNetworkMock(), baseState);

      assert.equal(baseState.events.length, 4);
      assert.deepEqual(baseState.events[2], {type: 'endSession', senderSessionId: 0, data: {sessionId: 1}, vt: game.state.clock});
      assert.deepEqual(baseState.events[3], {type: 'endSession', senderSessionId: 0, data: {sessionId: 2}, vt: game.state.clock});
    });
  });

  describe('on network startSession events', function(){
    it('should fire an event and then send gamedata', function(){
      var network = buildNetworkMock(),
          game = new this.Game(network),
          called = [],
          event = {a: 2, b: 'abc'};

      // mock out buildEvent
      game.buildEvent = function(){ 
        return event; 
      };

      game.fire = function(inEvent){
        assert.deepEqual(inEvent, event);
        called.push('fire');
      };

      network.send = function(sessionId, type, data){
        assert.equal(sessionId, 3);
        assert.equal('gamedata', type);
        assert.deepEqual(game.state, data);
        called.push('send');
      };

      network.eventCallbacks['startSession'](3);

      assert.deepEqual(called, ['fire', 'send']);
    });
  });

  it('should call fire on endSession events', function(){
    var network = buildNetworkMock(),
        game = new this.Game(network),
        called = 0,
        event = {abc: 2, a: [1, 3, 'a']};

    // mock out buildEvent
    game.buildEvent = function(){
      return event;
    };

    game.fire = function(inEvent){
      assert.deepEqual(event, inEvent);
      called++;
    };

    network.eventCallbacks['endSession'](4);

    assert.equal(called, 1);
  });

  it('should call fire on gameevents', function(){
    var network = buildNetworkMock(),
        game = new this.Game(network),
        called = 0,
        event = {'gobbledey': ['gook', {'a': 2}], 'c': 3};

    // mock out buildEvent
    game.buildEvent = function(){
      return event;
    };

    game.fire = function(inEvent){
      assert.deepEqual(inEvent, event);
      called++;
    };

    network.eventCallbacks['gameevent'](3, 3);

    assert.equal(called, 1);
  });

  it('should call fire on heartbeats', function(){
    var network = buildNetworkMock(),
        game = new this.Game(network),
        event = {'blah': [1, 2], b: 2},
        called = 0;

    // mock out buildEvent
    game.buildEvent = function(){
      return event;
    };

    game.fire = function(inEvent){
      assert.deepEqual(inEvent, event);
      called++;
    };

    network.eventCallbacks['heartbeat'](3);

    assert.equal(called, 1);
  });

  describe('#loop', function(){
    it('should increment the virtual clock by 1', function(){
      var game = new this.Game(buildNetworkMock()),
          clock = game.state.clock;

      game.loop();

      assert.equal(clock + 1, game.state.clock);
    });

    it('should call Engine.safelyAdvance with game state', function(){
      var game = new this.Game(buildNetworkMock()),
          called = 0;

      game.Engine = {
        safelyAdvance: function(state){
          assert.deepEqual(state, game.state);
          called++;
        }
      };

      game.loop();

      assert.equal(called, 1);
    });
  });

  describe('#start and #stop', function(){
    it('should create a loop and a heartbeat interval', function(){
      var game = new this.Game(buildNetworkMock());
      assert.equal(typeof game.heartbeatInterval, 'undefined');
      assert.equal(typeof game.gameLoopInterval, 'undefined');
      game.start();
      assert.equal(typeof game.heartbeatInterval, 'object');
      assert.equal(typeof game.gameLoopInterval, 'object');
      clearInterval(game.heartbeatInterval);
      clearInterval(game.gameLoopInterval);
    });
  });

  describe('#buildEvent', function(){
    it('should require a type', function(){
      var game = new this.Game(buildNetworkMock());
      assert.throws(function(){
        game.buildEvent(null, 29);
      });
    });

    it('should require a senderSessionId', function(){
      var game = new this.Game(buildNetworkMock());
      assert.throws(function(){
        game.buildEvent('heartbeat', null);
      });
    });

    it('should return an event', function(){
      var game = new this.Game(buildNetworkMock()),
          type = 'heartbeat',
          senderSessionId = 28,
          data = {a: 2, b: 'abc'};

      var event = game.buildEvent(type, senderSessionId, data);

      assert.deepEqual(event, {
        type: type,
        senderSessionId: senderSessionId,
        data: data,
        vt: game.state.clock,
      });
    });
  });

  describe('#fire', function(){
    it('should push an event onto state.events and broadcast that event', function(){
      var network = buildNetworkMock(),
          game = new this.Game(network),
          event = {
            type: 'heartbeat',
            data: 'gabbl',
            senderSessionId: 3,
            vt: game.state.clock
          },
          called = 0;

      network.broadcast = function(inType, inEvent){
        assert.equal(event.type, inType);
        assert.deepEqual(event, inEvent);
        called++;
      };

      assert.equal(game.state.events.length, 0);

      game.fire(event);

      assert.equal(game.state.events.length, 1);
      assert.deepEqual(game.state.events[0], event);
      assert.equal(called, 1);
    });
  });

});
