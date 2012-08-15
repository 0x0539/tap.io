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
    return {};
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

    it('should reject if session id is nonnumeric', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildDisconnectEvent({data: {sessionId: 'abc'}}));
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

    it('should reject if session id is nonnumeric', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildConnectEvent({data: {sessionId: 'abc'}}));
      });
    });
  });

  describe('keyup events', function(){
    var buildKeyupEvent = function(overrides){
      var returned = buildEvent({
            type: 'gameevent',
            data: {
              type: 'keyup',
              which: 20
            }
          });
      return merge(returned, overrides);
    };

    it('should have a valid base', function(){
      var dis = this;
      assert.equal(buildKeyupEvent().type, 'gameevent');
      assert.equal(buildKeyupEvent().data.type, 'keyup');
      assert.doesNotThrow(function(){
        dis.Engine.validate(buildState(), buildKeyupEvent());
      });
    });

    it('should require a data.which', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildKeyupEvent({data: {type: 'keyup'}}));
      });
    });

    it('should not allow nonnumeric data.which', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildKeyupEvent({data: {type: 'keyup', which: 'abc'}}));
      });
    });
  });

  describe('other gameevent events', function(){
    it('should raise an error', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildEvent({type: 'gameevent'}));
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
