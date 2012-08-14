#!/usr/bin/env node
require('nodeunit').reporters.default.run([
  'engine-safe-zone-tests.js',
  'engine-safe-advance-point-tests.js',
  'engine-safely-advance-tests.js'
]);
