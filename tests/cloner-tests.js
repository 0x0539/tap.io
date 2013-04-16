var assert = require('assert'),
    reload = require('./reload');

describe('Cloner', function(){
  beforeEach(function(done){
    this.Cloner = reload.reload('../lib/shared/cloner.js').Cloner;
    done();
  });
  it('should be able to clone deeply nested objects', function(){
    var object = {
      q: [
        1, 
        2, 
        'abcd'
      ],
      p: {
        blart: 'happy',
        am: null,
        i: true,
        happy: [
          'to', 
          {
            see: 'you',
            again: 2
          }, 
          3
        ]
      }
    };
    var cloned = this.Cloner.clone(object);
    assert.deepEqual(object, cloned);
    assert.notEqual(object, cloned);
  });

  // starting to become an integration test
  it('should preserve cross-references', function(){
    var a = {a: 2, b: 'abc'},
        object = {b: a, c: a};
    var cloned = this.Cloner.clone(object);
    assert.equal(cloned.b, cloned.c);
  });

  it('should create a totally new object that can be modified without affecting the original', function(){
    var a = {a: 1, b: 2, c: [0, 1]},
        cloned = this.Cloner.clone(a);
    cloned.a++;
    cloned.c.push(false);
    assert.equal(cloned.a, a.a + 1);
    assert.equal(cloned.c.length, a.c.length + 1);
    assert.notEqual(cloned, a);
    assert.notDeepEqual(cloned, a);
  });
});
