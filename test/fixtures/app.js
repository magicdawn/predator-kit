'use strict';

global.Promise = require('bluebird');
var co = require('co');
var app = module.exports = require('koa')();
var Router = require('impress-router');
var router = Router();
var serve = require('koa-static');
var _ = require('lodash');
var debug = require('debug')('predator:demo');

// use router
app.use(router);


// create predator
// global.predator = require('../../')({
global.predator = require('predator-kit')({
  home: __dirname,
  app: app,
  router: router,
  buildDir: __dirname + '/public'
});
/* globals predator */

/**
 * when
 *   - production, we use `/public` dir
 *   - otherwise, we load a bunch of middlewares
 */
if (app.env === 'production') {
  app.use(serve(predator.buildDir));
} else {
  predator.startAssetsManager();
}

/**
 * 使用所有的router
 * index.js
 */
predator.loadAllRouter();

/**
 * error handle
 *
 * production 环境下, log err & 不expose error
 * development 默认环境下, log err & expose error
 * test 环境下, 不log error & expose error
 */
if (app.env !== 'production') {
  app.on('error', app.onerror); // log error when not test
  app.on('error', (err, ctx) => {
    err.expose = true;
  });
}