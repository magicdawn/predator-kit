'use strict';

const router = module.exports = require('impress-router')();
const render = require('predator-kit').getRender(__dirname);

router.get('/test', function*() {
  this.type = 'html';
  this.body = yield render('index');
});

router.get('/test/foo', function*() {
  this.body = '/test/foo';
});

router.get('/test/foo/bar', function*() {
  this.body = '/test/foo/bar';
});