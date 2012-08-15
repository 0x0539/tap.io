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
    new this.Game(buildNetworkMock());
  });

  it('should register with all network events on construction', function(){
    var network = buildNetworkMock(),
        eventTypes = {connect: true, disconnect: true, gameevent: true, heartbeat: true};

    network.on = function(eventType, callback){
      assert.ok(eventTypes.hasOwnProperty(eventType));
      delete eventTypes[eventType];
      assert.equal(typeof callback, 'function');
    };

    new this.Game(network);

    assert.deepEqual({}, eventTypes);
  });

  it('should call fire and then send gamedata on network connect events', function(){
    var network = buildNetworkMock(),
        game = new this.Game(network),
        called = [];

    game.fire = function(type, senderSessionId, data){
      assert.equal(type, 'connect');
      assert.equal(senderSessionId, 0);
      assert.deepEqual(data, {sessionId: 3});
      called.push('fire');
    };

    network.send = function(sessionId, type, data){
      assert.equal(sessionId, 3);
      assert.equal('gamedata', type);
      assert.deepEqual(game.state, data);
      called.push('send');
    };

    network.eventCallbacks['connect'](3);

    assert.deepEqual(called, ['fire', 'send']);
  });

  it('should call fire on disconnect events', function(){
    var network = buildNetworkMock(),
        game = new this.Game(network),
        called = 0;

    game.fire = function(type, senderSessionId, data){
      assert.equal(type, 'disconnect');
      assert.equal(senderSessionId, 0);
      assert.deepEqual(data, {sessionId: 4});
      called++;
    };

    network.eventCallbacks['disconnect'](4);

    assert.equal(called, 1);
  });

  it('should call fire on gameevents', function(){
    var network = buildNetworkMock(),
        game = new this.Game(network),
        called = 0,
        eventData = {'gobbledey': ['gook', {'a': 2}], 'c': 3};

    game.fire = function(type, senderSessionId, data){
      assert.equal(type, 'gameevent');
      assert.equal(senderSessionId, 3);
      assert.deepEqual(eventData, data);
      called++;
    };

    network.eventCallbacks['gameevent'](3, eventData);

    assert.equal(called, 1);
  });

  it('should call fire on heartbeats', function(){
    var network = buildNetworkMock(),
        game = new this.Game(network),
        called = 0;

    game.fire = function(type, senderSessionId, data){
      assert.equal(type, 'heartbeat');
      assert.equal(senderSessionId, 3);
      assert.equal(data, null);
      called++;
    };

    network.eventCallbacks['heartbeat'](3);

    assert.equal(called, 1);
  });

  describe('#loop', function(){
    it('should increment the virtual clock by 1', function(){
      var game = new this.Game(buildNetworkMock()),
          clock = game.clock;

      game.loop();

      assert.equal(clock + 1, game.clock);
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

  describe('#fire', function(){
    it('should require a type', function(){
      var game = new this.Game(buildNetworkMock());
      assert.throws(function(){
        game.fire(null, 29);
      });
    });

    it('should require a senderSessionId', function(){
      var game = new this.Game(buildNetworkMock());
      assert.throws(function(){
        game.fire('heartbeat', null);
      });
    });

    it('should push an event onto state.events and broadcast that event', function(){
      var network = buildNetworkMock(),
          game = new this.Game(network),
          type = 'heartbeat',
          senderSessionId = 3,
          data = 'gabbl',
          event = {
            type: type,
            data: data,
            senderSessionId: senderSessionId,
            vt: game.clock
          },
          called = 0;

      network.broadcast = function(inType, inEvent){
        assert.equal(type, inType);
        assert.deepEqual(event, inEvent);
        called++;
      };

      assert.equal(game.state.events.length, 0);

      game.fire(type, senderSessionId, data);

      assert.equal(game.state.events.length, 1);
      assert.deepEqual(game.state.events[0], event);
      assert.equal(called, 1);
    });


  });

});
