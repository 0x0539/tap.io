var assert = require('assert'),
    reload = require('./reload.js');

var merge = function(hash1, hash2){
  if(hash2 != null)
    for(var arg in hash2)
      hash1[arg] = hash2[arg];
  return hash1;
};

describe('Engine#validate', function(){

  beforeEach(function(done){
    this.Engine = reload.reload('../lib/shared/engine.js').Engine;
    done();
  });

  // at the time of writing, no validations look at the state, so this is stubbed
  var buildState = function(){
    return {a: 2, b: 'abc'};
  };

  // builds a base connect event to play with
  var buildEvent = function(overrides){
    var returned = {
      data: {
        sessionId: 1
      }, 
      type: 'connect', 
      vt: 2, 
      senderSessionId: 0
    }; 

    return merge(returned, overrides);
  };

  it('should have a valid base', function(){
    var dis = this;
    assert.doesNotThrow(function(){
      dis.Engine.validate(buildState(), buildEvent());
    });
  });

  // so meta
  it('test should allow us to override arguments with buildEvent', function(){
    var event = buildEvent({type: 2, vt: 'hahaha'});
    assert.deepEqual(event, {
      data: {
        sessionId: 1
      },
      type: 2,
      vt: 'hahaha',
      senderSessionId: 0
    });
  });

  it('should reject events without unknown type', function(){
    var dis = this;
    assert.throws(function(){
      dis.Engine.validate(buildState(), buildEvent({type: 'hapablap'}));
    });
  });

  it('should reject events with null type', function(){
    var dis = this;
    assert.throws(function(){
      dis.Engine.validate(buildState(), buildEvent({type: null}));
    });
  });

  it('should call validate for all plugins', function(){
    var state = buildState(),
        event = buildEvent(),
        called1 = 0,
        called2 = 0;

    this.Engine.plugins.push({
      validate: function(inState, inEvent){
        assert.deepEqual(state, inState);
        assert.deepEqual(event, inEvent);
        called1++;
      }
    });

    this.Engine.plugins.push({
      validate: function(inState, inEvent){
        assert.deepEqual(state, inState);
        assert.deepEqual(event, inEvent);
        called2++;
      }
    });

    this.Engine.validate(state, event);

    assert.equal(called1, 1);
    assert.equal(called2, 1);
  });

  it('should pass plugin validation errors', function(){
    var dis = this;

    assert.doesNotThrow(function(){
      dis.Engine.validate(buildState(), buildEvent());
    });

    this.Engine.plugins.push({
      validate: function(state, event){
        throw new Error('booyah');
      }
    });

    assert.throws(function(){
      dis.Engine.validate(buildState(), buildEvent());
    });

  });

  describe('disconnect events', function(){
    // builds a disconnect event
    var buildDisconnectEvent = function(overrides){
      var returned = buildEvent({
            type: 'disconnect', 
            data: {
              sessionId: 1
            },
            senderSessionId: 0
          });
      return merge(returned, overrides);
    };

    it('should have a valid base', function(){
      var dis = this;
      assert.equal(buildDisconnectEvent().type, 'disconnect');
      assert.doesNotThrow(function(){
        dis.Engine.validate(buildState(), buildDisconnectEvent());
      });
    });

    it('should reject if sender session id is nonzero', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildDisconnectEvent({senderSessionId: 1}));
      });
    });

    it('should reject if session id is 0', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildDisconnectEvent({data: {sessionId: 0}}));
      });
    });

    it('should reject if session id is missing', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildDisconnectEvent({data: {}}));
      });
    });
  });

  describe('connect events', function(){
    // builds a connect event (overriding important fields in case base event type changes)
    var buildConnectEvent = function(overrides){
      var returned = buildEvent({
            type: 'connect', 
            data: {
              sessionId: 1
            },
            senderSessionId: 0
          });
      return merge(returned, overrides);
    };

    it('should have a valid base', function(){
      var dis = this;
      assert.equal(buildConnectEvent().type, 'connect');
      assert.doesNotThrow(function(){
        dis.Engine.validate(buildState(), buildConnectEvent());
      });
    });

    it('should reject if sender session id is nonzero', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildConnectEvent({senderSessionId: 1}));
      });
    });

    it('should reject if session id is 0', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildConnectEvent({data: {sessionId: 0}}));
      });
    });

    it('should reject if session id is missing', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildConnectEvent({data: {}}));
      });
    });
  });

  describe('heartbeat events', function(){
    var buildHeartbeatEvent = function(overrides){
      var returned = buildEvent({type: 'heartbeat'});
      return merge(returned, overrides);
    };
    it('should have a valid base', function(){
      var dis = this;
      assert.doesNotThrow(function(){
        dis.Engine.validate(buildState(), buildHeartbeatEvent());
      });
    });
  });

});
