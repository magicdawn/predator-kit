'use strict';

require('should');
const request = require('supertest');
const predator = require('../lib');

describe('static exports should be ok', function() {
  it('exports.swig should be ok', function() {
    predator.swig.should.ok;
  });

  it('exports.getRender should be ok', function() {
    predator.getRender.should.ok;
  });
});