'use strict';

/**
 * less
 */
const Promise = require('bluebird');
const co = require('co');
const wrap = co.wrap;
const less = require('less');
const merge = require('lodash').merge;
const pathFn = require('path');
const fs = Promise.promisifyAll(require('fs'));
less.renderAsync = Promise.promisify(less.render);

exports.renderFileAsync = co.wrap(function*(file, options) {
  // set default options
  options = merge({
    filename: file
  }, options);

  // read
  const content = yield fs.readFileAsync(file, 'utf8');

  // render
  let output;

  try {
    output = yield less.renderAsync(content, options);
  } catch (e) {
    e.message = less.formatError(e);
    throw e;
  }

  // return
  return output.css;
});