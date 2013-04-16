var assert = require('assert'),
    reload = require('./reload.js');

describe('Utilities#spliceOut', function(){
  beforeEach(function(done){
    this.Utilities = reload.reload('../lib/shared/utilities.js').Utilities;
    done();
  });

  it('should be able to splice out strings', function(){
    var result = this.Utilities.spliceOut([2, 'abc', 'bc', null, 4, 'bc'], 'bc');
    assert.deepEqual(result, [2, 'abc', null, 4]);
  });

  it('should be able to splice out integers', function(){
    var result = this.Utilities.spliceOut([2, 1, 2, 1, 'b', 2], 2);
    assert.deepEqual(result, [1, 1, 'b']);
  });

  it('should return an empty array if passed an empty array', function(){
    var result = this.Utilities.spliceOut([], 2);
    assert.deepEqual(result, []);
  });
});
