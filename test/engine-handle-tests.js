var assert = require('assert'),
    reload = require('./reload.js');

describe('Engine#handle', function(){

  var Events = require('../lib/shared/constants.js').Constants.Events;

  beforeEach(function(done){
    this.Engine = reload.reload('../lib/shared/engine.js').Engine;
    this.Engine.validate = function(){}; // stubbed
    done();
  });

  it('should call validate when passed an event', function(){
    var event = 'event', 
        state = 'state',
        calls = 0;

    this.Engine.validate = function(inState, inEvent){
      assert.equal(inState, state);
      assert.equal(inEvent, event); 
      calls++;
    };

    this.Engine.handle(state, event);

    assert.equal(calls, 1);
  });

  it('should call handle on every plugin', function(){
    var state = {vt: 0},
        event = {type: 'effyeah'},
        called1 = 0,
        called2 = 0;

    this.Engine.plugins.push({
      handle: function(inState, inEvent){
        assert.deepEqual(inState, state);
        assert.deepEqual(inEvent, event);
        called1++;
      }
    });

    this.Engine.plugins.push({
      handle: function(inState, inEvent){
        assert.deepEqual(inState, state);
        assert.deepEqual(inEvent, event);
        called2++;
      }
    });

    this.Engine.handle(state, event);

    assert.equal(called1, 1);
    assert.equal(called2, 1);
  });

  it('should not throw an error if validate does', function(){
    this.Engine.validate = function(){
      throw new Error('crapz!');
    };

    assert.throws(function(){
      this.Engine.validate({}, {});
    });

    var dis = this;
    assert.doesNotThrow(function(){
      dis.Engine.handle({}, {});
    });
  });

  it('should not call handle on any plugins if there is a validation error', function(){
    this.Engine.validate = function(){
      throw new Error('crapz!');
    };

    assert.throws(function(){
      this.Engine.validate({}, {});
    });

    this.Engine.plugins.push({
      handle: function(){
        assert.ok(false);
      }
    });

    this.Engine.handle({}, {});
  });

  describe('on a startSession event', function(){
    it('should add the new session id to the sorted session id list', function(){
      var event = {
            type: Events.NEW_SESSION, 
            data: {
              sessionId: 3
            }
          }, 
          state = {
            sessionIds: [1, 2, 5, 6]
          };

      this.Engine.handle(state, event);

      assert.deepEqual(state.sessionIds, [1, 2, 3, 5, 6]);
    });
  });

  describe('on a endSession event', function(){
    it('should remove the session id from the sorted session id list', function(){
      var event = {
            type: Events.END_SESSION,
            data: {
              sessionId: 5 
            }
          },
          state = {
            sessionIds: [1, 2, 3, 5, 6]
          };

      this.Engine.handle(state, event);

      assert.deepEqual(state.sessionIds, [1, 2, 3, 6]);
    });
  });

});
