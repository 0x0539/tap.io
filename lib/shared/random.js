// For original source and comments, please see http://davidbau.com/encode/seedrandom.js
// 
// LICENSE (BSD):
//
// Copyright 2010 David Bau, all rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
// 
//   3. Neither the name of this module nor the names of its contributors may
//      be used to endorse or promote products derived from this software
//      without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

(window || exports).Random = (function(){

  var width = 256,
      chunks = 6,
      significance = 52,
      startdenom = Math.pow(width, chunks),
      significance = Math.pow(2, significance),
      overflow = significance * 2;

  var Random = function(seed){
    this.pool = [];

    mixkey(Math.random(), this.pool);

    this.seed(seed || 'cheese monkey');
  };

  //
  // seed()
  // Pass a string to this function to create a new random() function
  //
  Random.prototype.seed = function(seed){
    var key = [],
        dis = this;

    // Flatten the seed string or build one from local entropy if needed.
    seed = mixkey(flatten(seed, 3), key);

    // Use the seed to initialize an ARC4 generator.
    var arc4 = new ARC4(key, width);

    // Mix the randomness into accumulated entropy.
    mixkey(arc4.S, this.pool);

    // Override Math.random

    // This function returns a random double in [0, 1) that contains
    // randomness in every bit of the mantissa of the IEEE 754 value.

    this.random = function(){  // Closure to return a random double:
      var n = arc4.g(chunks);             // Start with a numerator n < 2 ^ 48
      var d = startdenom;                 //   and denominator d = 2 ^ 48.
      var x = 0;                          //   and no 'extra last byte'.
      while (n < significance) {          // Fill up all significant digits by
        n = (n + x) * width;              //   shifting numerator and
        d *= width;                       //   denominator and generating a
        x = arc4.g(1);                    //   new least-significant-byte.
      }
      while (n >= overflow) {             // To avoid rounding up, before adding
        n /= 2;                           //   last byte, shift everything
        d /= 2;                           //   right using integer math until
        x >>>= 1;                         //   we have exactly the desired bits.
      }
      return (n + x) / d;                 // Form the number within [0, 1).
    };

    // Return the seed that was used
    return seed;
  };

  //
  // ARC4
  //
  // An ARC4 implementation.  The constructor takes a key in the form of
  // an array of at most (width) integers that should be 0 <= x < (width).
  //
  // The g(count) method returns a pseudorandom integer that concatenates
  // the next (count) outputs from ARC4.  Its return value is a number x
  // that is in the range 0 <= x < (width ^ count).
  //
  /** @constructor */
  function ARC4(key, width) {
    var t, u, me = this, keylen = key.length;
    var i = 0, j = me.i = me.j = me.m = 0;
    me.S = [];
    me.c = [];

    // The empty key [] is treated as [0].
    if (!keylen) { key = [keylen++]; }

    // Set up S using the standard key scheduling algorithm.
    while (i < width) { me.S[i] = i++; }
    for (i = 0; i < width; i++) {
      t = me.S[i];
      j = lowbits(j + t + key[i % keylen]);
      u = me.S[j];
      me.S[i] = u;
      me.S[j] = t;
    }

    // The "g" method returns the next (count) outputs as one number.
    me.g = function getnext(count) {
      var s = me.S;
      var i = lowbits(me.i + 1); var t = s[i];
      var j = lowbits(me.j + t); var u = s[j];
      s[i] = u;
      s[j] = t;
      var r = s[lowbits(t + u)];
      while (--count) {
        i = lowbits(i + 1); t = s[i];
        j = lowbits(j + t); u = s[j];
        s[i] = u;
        s[j] = t;
        r = r * width + s[lowbits(t + u)];
      }
      me.i = i;
      me.j = j;
      return r;
    };
    // For robust unpredictability discard an initial batch of values.
    // See http://www.rsa.com/rsalabs/node.asp?id=2009
    me.g(width);
  }

  //
  // flatten()
  // Converts an object tree to nested arrays of strings.
  //
  /** @param {Object=} result 
    * @param {string=} prop
    * @param {string=} typ */
  function flatten(obj, depth) {
    var result = [],
        typ = typeof(obj);
    if (depth && typ == 'object') {
      for (var prop in obj) {
        if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
          try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
        }
      }
    }
    return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
  }

  //
  // mixkey()
  // Mixes a string seed into a key that is an array of integers, and
  // returns a shortened string seed that is equivalent to the result key.
  //
  /** @param {number=} smear 
    * @param {number=} j */
  function mixkey(seed, key) {
    seed += '';                         // Ensure the seed is a string
    var smear = 0;
    for (var j = 0; j < seed.length; j++) {
      key[lowbits(j)] =
        lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
    }
    seed = '';
    for (j in key) { seed += String.fromCharCode(key[j]); }
    return seed;
  }

  //
  // lowbits()
  // A quick "n mod width" for width a power of 2.
  //
  function lowbits(n) { return n & (width - 1); }

  return Random;
})();
