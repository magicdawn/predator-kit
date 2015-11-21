'use strict';

const request = require('supertest');
let app = require('./fixtures/app');
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

  describe('css', function() {
    it('less middleware for */css/main/**/*.css', function(done) {
      request(app)
        .get('/test/css/main/index.css')
        .expect(200, done);
    });

    it('serve static for other', function(done) {
      request(app)
        .get('/test/css/foo/index.less')
        .expect(200)
        .end(() => {
          request(app)
            .get('/test/css/index.css')
            .expect(200, done);
        });
    });

    it('show error message when not production', function(done) {
      request(app)
        .get('/test/css/main/error.css')
        .end((err, res) => {

          // status
          res.status.should.equal(500);

          // expose error
          res.text.should.match(/@@import/);
          res.text.should.match(/ParseError/);

          // console.log(res.text);
          done();
        });
    });
  });

  describe('js', function() {

    it('browserify middleware for /global/js/main/index.json', done => {
      request(app)
        .get('/global/js/main/index.js')
        .expect(200, done);
    });

    it('browserify middleware for js/main/*', done => {
      request(app)
        .get('/test/js/main/index.js')
        .expect(200, done);
    });

    it('serve static for other', done => {
      request(app)
        .get('/test/js/index.js')
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          request(app)
            .get('/test/js/foo/bar.js')
            .expect(200, done);
        });
    });

    it('show error message when not production', done => {

      request(app)
        .get('/test/js/main/error.js')
        .end((err, res) => {

          // status
          res.status.should.equal(500);

          // error
          // console.log(res.text);
          res.text.should.match(/cannot find module/i);
          res.text.should.match(/not-exists/);

          done();
        });
    });
  });
});