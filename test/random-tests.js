var assert = require('assert'),
    reload = require('./reload');

describe('Random', function(){
  beforeEach(function(done){
    this.Random = reload.reload('../lib/shared/random.js').Random;
    done();
  });

  it('should return 0.27090452108404856 on the first call with seed "cheese monkey"', function(){
    assert.equal(new this.Random().seed('cheese monkey').random(), 0.27090452108404856);
  });

  it('should have a default seed of "cheese monkey"', function(){
    assert.equal(new this.Random().random(), new this.Random('cheese monkey').random());
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
    var r1 = new this.Random().seed('hapablap'),
        r2 = new this.Random();
    assert.notEqual(r1.random(), r2.random());
  });

  it('should return the same results on the first few calls after seeding', function(){
    var r1 = new this.Random().seed('hapablap'),
        r2 = new this.Random().seed('hapablap');
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

  it('should allow wrapping of random data by Random objects', function(){
    var r1 = new this.Random('this shit cray'),
        r2 = new this.Random('this shit cray'),
        r3 = new this.Random().wrap(r1.arc4);
    assert.equal(r1.random(), r2.random());
    assert.equal(r3.random(), r2.random());
    assert.equal(r1.random(), r2.random());
  });
});
