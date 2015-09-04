/**
 * build operation for Predator
 */

/**
 * module dependencies
 */
var glob = require('glob');
var util = require('./util');
var Hash = util.Hash;
var fmt = require('util').format;
var mkdirpSync = require('mkdirp').sync;
var co = require('co');
var path = require('path');
var fs = require('fs');

/**
 * 只复制
 */
exports.buildCopy = function(globPatterns) {
  var self = this;
  var cwd = this.home + '/app';
  var debug = require('debug')('predator:build:copy');

  globPatterns.forEach(function(pattern) {
    var files = glob.sync(pattern, {
      cwd: cwd
    });

    files.forEach(function(f) {
      var src = self.home + '/app/' + f;
      var dest = self.buildDir + '/' + f;

      debug('copy %s -> %s', src, dest);
      util.copy(src, dest);
    });
  });
};

/**
 * 进行hash操作, 不引用其他的资源, 没有替换操作
 */
exports.buildStatic = function(globPatterns, rev) {
  var self = this;
  var cwd = this.home + '/app';
  var debug = require('debug')('predator:build:buildStatic');

  globPatterns.forEach(function(pattern) {

    var files = glob.sync(pattern, {
      cwd: cwd
    });

    files.forEach(function(f) {
      var original = f;
      var src = self.home + '/app/' + f;
      var hash = util.Hash.file(src);

      // setup rev map
      var parsed = path.parse(f);
      var hashed = fmt('%s/%s_%s%s', parsed.dir, parsed.name, hash, parsed.ext);
      debug('%s -> %s', original, hashed);
      rev[original] = hashed;

      // write file
      var dest = self.buildDir + '/' + hashed;
      util.ensureDir(dest);
      util.copy(src, dest);
    });
  });
};

/**
 * less
 *
 * 处理less, 替换图片资源等
 */
exports.buildLessAsync = co.wrap(function * (globPatterns, rev) {
  var self = this;
  var cwd = this.home + '/app';
  var debug = require('debug')('predator:build:buildLessAsync');

  for (var i = 0; i < globPatterns.length; i++) {
    var pattern = globPatterns[i];
    var files = glob.sync(pattern, {
      cwd: cwd
    });

    for (var j = 0; j < files.length; j++) {
      var f = files[j];
      var original = f;

      // build hash
      var src = self.home + '/app/' + f;
      var content = yield self.renderLessAsync(src);
      content = util.processRev(content, rev);
      var hash = Hash.string(content);
      var parsed = path.parse(original);
      var hashed = fmt('%s/%s_%s%s', parsed.dir, parsed.name, hash, '.css');
      debug('%s -> %s', original, hashed);
      rev[original] = hashed;

      // write file
      var dest = self.buildDir + '/' + hashed;
      util.ensureDir(dest);
      fs.writeFileSync(dest, content, 'utf8');
    };
  };
});


exports.buildJsAsync = co.wrap(function * (globPatterns, rev) {
  var self = this;
  var cwd = this.home + '/app';
  var debug = require('debug')('predator:build:buildJsAsync');

  for (var i = 0; i < globPatterns.length; i++) {
    var pattern = globPatterns[i];

    var files = glob.sync(pattern, {
      cwd: cwd
    });

    for (var j = 0; j < files.length; j++) {
      var f = files[j];
      if (f === 'global/js/main/index.json') { // hack on global js
        f = 'global/js/main/index.js'
      }
      var original = f;

      // build hash
      var src = self.home + '/app/' + f;
      var b = self.createBrowserify(src);
      var content = (yield b.bundleAsync()).toString('utf8');
      content = util.processRev(content, rev);
      var hash = Hash.string(content);
      var parsed = path.parse(original);
      var hashed = fmt('%s/%s_%s%s', parsed.dir, parsed.name, hash, '.js');
      debug('%s -> %s', original, hashed);
      rev[original] = hashed;

      // write file
      var dest = self.buildDir + '/' + hashed;
      util.ensureDir(dest);
      fs.writeFileSync(dest, content, 'utf8');
    }
  }
});

/**
 * 处理视图
 *
 * 只替换资源
 */
exports.buildView = function(globPatterns, rev) {
  var self = this;
  var cwd = this.home + '/app';
  var debug = require('debug')('predator:build:buildView');

  globPatterns.forEach(function(pattern) {
    var files = glob.sync(pattern, {
      cwd: cwd
    });

    files.forEach(function(f) {
      var file = self.home + '/app/' + f;
      var content = fs.readFileSync(file, 'utf8');
      content = util.processRev(content, rev);
      content = content.replace(/\/view(?=\/)/g, '/view_build');


      // write file
      var dest = file.replace(/\/view(?=\/)/, '/view_build');
      debug('%s -> %s', file, dest);
      util.ensureDir(dest);
      fs.writeFileSync(dest, content, 'utf8');
    })
  });
};