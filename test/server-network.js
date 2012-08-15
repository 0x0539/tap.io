var assert = require('assert'),
    reload = require('./reload.js');

describe('Network', function(){
  var buildIoMock = function(){
    // mocked io object
    return {
      sockets: {
        on: function(type, callback){
          this.callbacks = this.callbacks || {};
          this.callbacks[type] = callback;
        }
      }
    };
  };

  var buildIoModuleMock = function(){
    return {
      listenCalled: 0,
      listen: function(port){
        this.port = port;
        this.listenCalled++;
        return buildIoMock();
      }
    };
  };

  beforeEach(function(done){
    this.Network = reload.reload('../lib/server/network.js').Network;
    done();
  });

  describe('#getNextSessionId', function(){
    it('should generate an id starting with a unix date and ending with current sessionIdCounter', function(){
      var network = new this.Network(20239),
          sessionIdRegex = new RegExp('^[0-9]+-' + network.sessionIdCounter + '$');
      assert.ok(sessionIdRegex.test(network.getNextSessionId()));
    });
    it('should increment the sessionIdCounter variable', function(){
      var network = new this.Network(20239),
          before = network.sessionIdCounter;
      network.getNextSessionId();
      assert.equal(before + 1, network.sessionIdCounter);
    });
  });

  describe('#start', function(){
    beforeEach(function(done){
      this.network = new this.Network(2020);
      this.mockedIo = buildIoModuleMock();
      this.network.IO = this.mockedIo;
      done();
    });
    it('should throw an error if started twice', function(){
      this.network.start();
      assert.throws(function(){
        this.network.start();
      });
    });
    it('should call listen on the io module with the correct port', function(){
      assert.equal(0, this.mockedIo.listenCalled);
      assert.equal(null, this.mockedIo.port);
      this.network.start();
      assert.equal(1, this.mockedIo.listenCalled);
      assert.equal(2020, this.mockedIo.port);
    });
    it('should bind to the connection event on the io object', function(){
      this.network.start();
      assert.notEqual(null, this.network.io.sockets.callbacks);
      assert.ok(this.network.io.sockets.callbacks.hasOwnProperty('connection'));
      assert.equal('function', typeof this.network.io.sockets.callbacks['connection']);
    });
  });

  describe('#onConnection', function(){
    var buildSocketMock = function(){
      return {
        on: function(type, callback){
          this.callbacks = this.callbacks || {};
          this.callbacks[type] = callback;
        }
      }
    };

    beforeEach(function(done){
      this.network = new this.Network(2012);
      done();
    });

    it('should emit a connect event and increment sessionIdCounter', function(){
      var calls = 0;
      var sessionId = 'awwwyeah';

      // mock out getNextSessionId
      this.network.getNextSessionId = function(){
        return 'awwwyeah';
      };

      this.network.emit = function(type, inSessionId){
        calls++;
        assert.equal('connect', type);
        assert.equal(sessionId, inSessionId);
      };
      
      this.network.onConnection(buildSocketMock());

      assert.equal(calls, 1);
    });

    it('should increment sessionIdCounter', function(){
      var sessionId = this.network.sessionIdCounter;
      this.network.onConnection(buildSocketMock());
      assert.equal(this.network.sessionIdCounter, sessionId + 1);
    });

    it('should add a socket with the correct id to the sockets array', function(){
      var mock = buildSocketMock(),
          sessionId = 'crazay';

      // mock out getNextSessionId
      this.network.getNextSessionId = function(){
        return sessionId;
      };

      this.network.onConnection(mock);
      assert.equal(mock, this.network.sockets[sessionId]);
    });

    it('should bind to socket.disconnect, socket.gameevent, and socket.heartbeat', function(){
      var socket = buildSocketMock();

      this.network.onConnection(socket);

      assert.ok(socket.callbacks.hasOwnProperty('disconnect'));
      assert.ok(socket.callbacks.hasOwnProperty('gameevent'));
      assert.ok(socket.callbacks.hasOwnProperty('heartbeat'));
    });

    it('should handle a disconnect event by deleting the socket and firing a disconnect', function(){
      var s1 = buildSocketMock(),
          s2 = buildSocketMock(),
          s1SessionId = null,
          s2SessionId = null,
          calls = [];

      this.network.emit = function(type, sessionId){ if(type == 'connect') s1SessionId = sessionId; };
      this.network.onConnection(s1);

      this.network.emit = function(type, sessionId){ if(type == 'connect') s2SessionId = sessionId; };
      this.network.onConnection(s2);

      assert.ok(this.network.sockets.hasOwnProperty(s2SessionId));

      this.network.emit = function(type, sessionId){ calls.push({type: type, sessionId: sessionId}); }
      s2.callbacks.disconnect();

      assert.ok(!this.network.sockets.hasOwnProperty(s2SessionId));
      assert.deepEqual(calls, [{type: 'disconnect', sessionId: s2SessionId}]);
    });

    it('should handle a gameevent by firing a gameevent', function(){
      var s1 = buildSocketMock(),
          s2 = buildSocketMock(),
          s1SessionId = null,
          s2SessionId = null,
          event = {a: 2, b: 3},
          calls = [];

      this.network.emit = function(type, sessionId){ if(type == 'connect') s1SessionId = sessionId; };
      this.network.onConnection(s1);

      this.network.emit = function(type, sessionId){ if(type == 'connect') s2SessionId = sessionId; };
      this.network.onConnection(s2);

      this.network.emit = function(type, sessionId, event){ 
        calls.push({type: type, sessionId: sessionId, event: event}); 
      };

      s1.callbacks.gameevent(event);

      assert.deepEqual(calls, [{type: 'gameevent', sessionId: s1SessionId, event: event}]);
    });

    it('should handle a heartbeat by firing a heartbeat', function(){
      var s1 = buildSocketMock(),
          s2 = buildSocketMock(),
          s1SessionId = null,
          s2SessionId = null,
          calls = [];

      this.network.emit = function(type, sessionId){ if(type == 'connect') s1SessionId = sessionId; };
      this.network.onConnection(s1);

      this.network.emit = function(type, sessionId){ if(type == 'connect') s2SessionId = sessionId; };
      this.network.onConnection(s2);

      this.network.emit = function(type, sessionId){ 
        calls.push({type: type, sessionId: sessionId}); 
      };

      s2.callbacks.heartbeat();

      assert.deepEqual(calls, [{type: 'heartbeat', sessionId: s2SessionId}]);
    });
  });


  describe('broadcast', function(){
    beforeEach(function(done){
      this.network = new this.Network(2012);
      done();
    });
    it('should call send for every socket', function(){
      var expected = {2: true, 8: true, 7: true, 9: true},
          type = 'gabble',
          data = {blah: 2},
          called = 0;

      this.network.sockets = {2: 'abc', 8: 'c', 7: 'ceh', 9: 'd'};

      this.network.send = function(sessionId, inType, inData){
        assert.ok(expected.hasOwnProperty(sessionId));
        delete expected[sessionId];
        assert.equal(type, inType);
        assert.deepEqual(data, inData);
        called++;
      };

      this.network.broadcast(type, data);

      assert.equal(called, 4);
    });
  });

  describe('send', function(){
    it('should call emit for the named socket', function(){
      var network = new this.Network(1000),
          type = 'hapabalab',
          data = {a: 2, b: 'z'},
          called = 0;

      network.sockets = {
        2: {
          emit: function(type, data){
            assert.ok(false);
          }
        },
        3: {
          emit: function(inType, inData){
            assert.equal(type, inType);
            assert.equal(data, inData);
            called++;
          }
        }
      };

      network.send(3, type, data);

      assert.equal(called, 1);
    });
  });

});
