'use strict';

var request = require('supertest');
var app = require('./fixtures/app');
require('should');

describe('use middleware when dev', function() {

  // prepare app
  app = app.callback();

  describe('static in', function() {

    it('fonts should be ok', function(done) {
      request(app)
        .get('/test/fonts/demo.font')
        .expect(200, done);
    });

    it('assets should be ok', function(done) {
      request(app)
        .get('/test/assets/demo.asset')
        .expect(200, done);
    });

    it('img should be ok', function(done) {
      request(app)
        .get('/test/img/predator.jpg')
        .expect(200, done);
    });
  });

  describe('less middleware for css/main/*', function() {
    // body...
  });

  describe('browserify middleware for js/main/*', function() {
    // body...
  });
});