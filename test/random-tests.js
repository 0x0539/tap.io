var assert = require('assert'),
    reload = require('./reload');

describe('Random', function(){
  beforeEach(function(done){
    this.Random = reload.reload('../lib/shared/random.js').Random;
    done();
  });

  it('should return the same results on the first few calls', function(){
    var r1 = new this.Random(),
        r2 = new this.Random();
    assert.equal(r1.random(), r2.random());
    assert.equal(r1.random(), r2.random());
    assert.equal(r1.random(), r2.random());
    assert.equal(r1.random(), r2.random());
  });

  it('should seed from the constructor', function(){
    var r1 = new this.Random('hapablap'),
        r2 = new this.Random();
    assert.notEqual(r1.random(), r2.random());
  });

  it('should return the same results on the first few calls after seeding', function(){
    var r1 = new this.Random('hapablap'),
        r2 = new this.Random('hapablap');
    assert.equal(r1.random(), r2.random());
    assert.equal(r1.random(), r2.random());
    assert.equal(r1.random(), r2.random());
    assert.equal(r1.random(), r2.random());
  });

  it('should return different results for different seeds', function(){
    var r1 = new this.Random(),
        r2 = new this.Random();
    r2.seed('garbage');
    assert.notEqual(r1.random(), r2.random());
  });

  it('should return the same old results after resetting the seed', function(){
    var r1 = new this.Random(),
        r2 = new this.Random();
    r1.random();
    r1.random();
    r1.seed('winchester');
    r2.seed('winchester');
    assert.equal(r1.random(), r2.random());
  });
});
