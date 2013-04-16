var assert = require('assert'),
    Utilities = require('../lib/shared/utilities.js').Utilities,
    Parameters = require('../lib/shared/parameters.js').Parameters;

describe('Utilities#ms2ticks', function(){
  it('should work without a ratio argument', function(){
    var expected = Math.ceil(28277 / Parameters.vtPeriodInMillis);
    assert.equal(Utilities.ms2ticks(28277), expected);
  });
  it('should work with a ratio argument', function(){
    var vtPeriodInMillis = 10, ms = 95;
    assert.equal(Utilities.ms2ticks(ms, vtPeriodInMillis), 10);
  });
});

describe('Utilities#ticks2ms', function(){
  it('should work without a ratio argument', function(){
    var expected = Math.ceil(28277 * Parameters.vtPeriodInMillis);
    assert.equal(Utilities.ticks2ms(28277), expected);
  });
  it('should work with a ratio argument', function(){
    var vtPeriodInMillis = 120, ticks = 4;
    assert.equal(Utilities.ticks2ms(ticks, vtPeriodInMillis), 480);
  });
});
