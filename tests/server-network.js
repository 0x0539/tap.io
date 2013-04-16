var assert = require('assert'),
    reload = require('./reload.js');

describe('Network', function(){

  var Events = require('../lib/shared/constants.js').Constants.Events;

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

    it('should emit a startSession event and increment sessionIdCounter', function(){
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
      assert.equal(mock, this.network.sessions[sessionId].socket);
      assert.equal(sessionId, this.network.sessions[sessionId].sessionId);
      assert.equal(this.network, this.network.sessions[sessionId].network);
    });

    it('should bind to socket.disconnect, socket.gameevent, and socket.heartbeat', function(){
      var socket = buildSocketMock();

      this.network.onConnection(socket);

      assert.ok(socket.callbacks.hasOwnProperty('tap.io'));
      assert.ok(socket.callbacks.hasOwnProperty('disconnect'));
    });

    it('should handle a disconnect event by deleting the socket and firing a disconnect', function(){
      var s1 = buildSocketMock(),
          s2 = buildSocketMock(),
          s1SessionId = null,
          s2SessionId = null,
          calls = [],
          timesCalled = 0;

      this.network.on('connect', function(sessionId){ 
        switch(timesCalled++){
          case 0:
            s1SessionId = sessionId; 
            break;
          case 1:
            s2SessionId = sessionId;
            break;
        }
      });

      this.network.onConnection(s1);
      this.network.onConnection(s2);

      assert.ok(this.network.sessions.hasOwnProperty(s1SessionId));
      assert.ok(this.network.sessions.hasOwnProperty(s2SessionId));

      this.network.emit('disconnect', s2SessionId);

      assert.ok(this.network.sessions.hasOwnProperty(s1SessionId));
      assert.ok(!this.network.sessions.hasOwnProperty(s2SessionId));
    });
  });
});
