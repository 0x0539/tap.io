var assert = require('assert'),
    reload = require('./reload.js');

var merge = function(hash1, hash2){
  if(hash2 != null)
    for(var arg in hash2)
      hash1[arg] = hash2[arg];
  return hash1;
};

describe('Engine#validate', function(){

  var Events = require('../lib/shared/constants.js').Constants.Events;

  beforeEach(function(done){
    this.Engine = reload.reload('../lib/shared/engine.js').Engine;
    done();
  });

  // at the time of writing, no validations look at the state, so this is stubbed
  var buildState = function(){
    return {a: 2, b: 'abc'};
  };

  // builds a base startSession event to play with
  var buildEvent = function(overrides){
    var returned = {
      data: {
        sessionId: 1
      }, 
      type: Events.NEW_CONNECTION, 
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

  describe('endSession events', function(){
    // builds a endSession event
    var buildEndSessionEvent = function(overrides){
      var returned = buildEvent({
            type: Events.CONNECTION_LOST, 
            data: {
              sessionId: 1
            },
            senderSessionId: 0
          });
      return merge(returned, overrides);
    };

    it('should have a valid base', function(){
      var dis = this;
      assert.equal(buildEndSessionEvent().type, Events.CONNECTION_LOST);
      assert.doesNotThrow(function(){
        dis.Engine.validate(buildState(), buildEndSessionEvent());
      });
    });

    it('should reject if sender session id is nonzero', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildEndSessionEvent({senderSessionId: 1}));
      });
    });

    it('should reject if session id is 0', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildEndSessionEvent({data: {sessionId: 0}}));
      });
    });

    it('should reject if session id is missing', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildEndSessionEvent({data: {}}));
      });
    });
  });

  describe('startSession events', function(){
    // builds a startSession event (overriding important fields in case base event type changes)
    var buildStartSessionEvent = function(overrides){
      var returned = buildEvent({
            type: Events.NEW_CONNECTION, 
            data: {
              sessionId: 1
            },
            senderSessionId: 0
          });
      return merge(returned, overrides);
    };

    it('should have a valid base', function(){
      var dis = this;
      assert.equal(buildStartSessionEvent().type, Events.NEW_CONNECTION);
      assert.doesNotThrow(function(){
        dis.Engine.validate(buildState(), buildStartSessionEvent());
      });
    });

    it('should reject if sender session id is nonzero', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildStartSessionEvent({senderSessionId: 1}));
      });
    });

    it('should reject if session id is 0', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildStartSessionEvent({data: {sessionId: 0}}));
      });
    });

    it('should reject if session id is missing', function(){
      var dis = this;
      assert.throws(function(){
        dis.Engine.validate(buildState(), buildStartSessionEvent({data: {}}));
      });
    });
  });

  describe('heartbeat events', function(){
    var buildHeartbeatEvent = function(overrides){
      var returned = buildEvent({type: Events.EMPTY});
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
