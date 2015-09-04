/**
 * js
 */

var browserify = require('browserify');
var co = require('co');
var path = require('path');

exports.bundle = function(js) {
  // js = /:component/js/foo
  if (js === '/global/js/index') {
    return exports.bundleGlobal();
  } else {
    return exports.bundleJs(js);
  }
};

exports.bundleGlobal = function() {
  var b = browserify({
    basedir: __dirname + '/app/global/js'
  });

  globalExternal.forEach(function(item) {
    b.require(item.require, {
      expose: item.expose
    });
  });

  return b.bundle();
};

exports.bundleJs = function(js) {
  js = path.join(__dirname, '../app', js + '.js');

  var b = browserify(js, {
    basedir: path.dirname(js)
  });

  globalExternal.forEach(function(item) {
    b.external(item.expose);
  });

  return b.bundle();
};