/**
 * less
 */
var co = require('co');
var less = require('less');
var Promise = require('bluebird');
var merge = require('lodash').merge;
var pathFn = require('path');
var fs = Promise.promisifyAll(require('fs'));
less.renderAsync = Promise.promisify(less.render);

exports.renderFileAsync = co.wrap(function * (file, options) {

  // set default options
  options = merge({
    sourceMap: {
      sourceMapFileInline: true
    },
    paths: [
      '.',
      pathFn.join(__dirname, '../app')
    ],
    filename: file
  }, options);

  // read
  var content = yield fs.readFileAsync(file, 'utf8');

  // render
  var output = yield less.renderAsync(content, options);

  // return
  return output.css;
});