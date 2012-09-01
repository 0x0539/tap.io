var assert = require('assert'),
    reload = require('./reload');

describe('Serializer', function(){
  beforeEach(function(done){
    this.Serializer = reload.reload('../lib/shared/serializer.js').Serializer;
    done();
  });

  it('should be able to serialize and deserialize deeply nested objects', function(){
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
    var returned = this.Serializer.deserialize(this.Serializer.serialize(object));
    assert.deepEqual(returned, object);
  });

  it('should be able to serialize and deserialize deeply nested arrays', function(){
    var array = [
      2, 
      {
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
      },
      'hap',
      null,
      true
    ];
    var returned = this.Serializer.deserialize(this.Serializer.serialize(array));
    assert.deepEqual(returned, array);
  });

  it('should preserve cross-references of arrays', function(){
    var a = [1, 2, 3],
        object = {b: a, c: a};
    var returned = this.Serializer.deserialize(this.Serializer.serialize(object));
    assert.equal(returned.b, returned.c);
  });

  it('should preserve cross-references of objects', function(){
    var a = {a: 2, b: 'abc'},
        object = {b: a, c: a};
    var returned = this.Serializer.deserialize(this.Serializer.serialize(object));
    assert.equal(returned.b, returned.c);
  });

  it('should preserve cross-references within arrays', function(){
    var a = [1, 2, 3],
        b = {q: 'abc'},
        object = [a, a, b, b];
    var returned = this.Serializer.deserialize(this.Serializer.serialize(object));
    assert.equal(returned[0], returned[1]);
    assert.equal(returned[2], returned[3]);
  });

  it('should preserve cross-references within objects', function(){
    var a = [1, 2, 3],
        b = {q: 'abc'},
        object = {a: a, b: a, c: b, d: b};
    var returned = this.Serializer.deserialize(this.Serializer.serialize(object));
    assert.equal(returned.a, returned.b);
    assert.equal(returned.c, returned.d);
  });

  it('should be able to handle cross-references to earlier objects in an object', function(){
    var a = {p: 2},
        object = {
          a: a,
          b: {
            a: a
          }
        };
    var returned = this.Serializer.deserialize(this.Serializer.serialize(object));
    assert.equal(returned.a, returned.b.a);
  });

  it('should be able to handle cross-references to earlier objects in an array', function(){
    var a = {p: 2},
        object = [ a, a, a ];
    var r = this.Serializer.deserialize(this.Serializer.serialize(object));
    assert.equal(r[0], r[1]);
    assert.equal(r[0], r[2]);
  });

  it('should handle cyclical object references', function(){
    var a = {};
    a.a = a;
    var r = this.Serializer.deserialize(this.Serializer.serialize(a));
    assert.equal(r.a, r.a.a);
    assert.equal(r.a, r.a.a.a);
  });

  it('should handle cyclical array references', function(){
    var a = [];
    a.push(a);
    var r = this.Serializer.deserialize(this.Serializer.serialize(a));
    assert.equal(r[0], r[0][0]);
    assert.equal(r[0], r[0][0][0]);
  });

  it('should be able to serialize and deserialize numbers', function(){
    assert.equal(2.05, this.Serializer.deserialize(this.Serializer.serialize(2.05)));
  });

  it('should be able to serialize and deserialize null', function(){
    assert.equal(null, this.Serializer.deserialize(this.Serializer.serialize(null)));
  });

  it('should be able to serialize and deserialize strings', function(){
    assert.equal('crap this rules', this.Serializer.deserialize(this.Serializer.serialize('crap this rules')));
  });

  it('should be able to serialize and deserialize booleans', function(){
    assert.equal(true, this.Serializer.deserialize(this.Serializer.serialize(true)));
  });

  it('should be able to serialize and deserialize undefined\'s', function(){
    var a;
    assert.equal('undefined', typeof this.Serializer.deserialize(this.Serializer.serialize(a)));
  });

  it('should be able to handle undefined fields in objects', function(){
    var a,
        b = {a: a};
    assert.deepEqual(b, this.Serializer.deserialize(this.Serializer.serialize(b)));
  });

  it('should be able to handle undefined values in arrays', function(){
    var a,
        b = [a, 1, a];
    assert.deepEqual(b, this.Serializer.deserialize(this.Serializer.serialize(b)));
  });

});
