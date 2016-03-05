/**
 * build operation for Predator
 */

/**
 * module dependencies
 */
'use strict';
const glob = require('glob');
const util = require('./util');
const Hash = util.Hash;
const fmt = require('util').format;
const co = require('co');
const path = require('path');
const fs = require('fs-extra');
const UglifyJs = require('uglify-js');
const request = require('needle-kit').request;
const minify = require('html-minifier').minify;
const _ = require('lodash');
const CleanCss = require('clean-css');

/**
 * 只复制
 */
exports.buildCopy = function(globPatterns) {
  const self = this;
  const cwd = this.home + '/app';
  const debug = require('debug')('predator:build:copy');

  globPatterns.forEach(function(pattern) {
    const files = glob.sync(pattern, {
      cwd: cwd
    });

    files.forEach(function(f) {
      const src = self.home + '/app/' + f;
      const dest = self.buildDir + '/' + f;

      debug('copy %s -> %s', src, dest);
      fs.copySync(src, dest);
    });
  });
};

/**
 * 进行hash操作, 不引用其他的资源, 没有替换操作
 */
exports.buildStatic = function(globPatterns, rev) {
  const self = this;
  const cwd = this.home + '/app';
  const debug = require('debug')('predator:build:buildStatic');

  globPatterns.forEach(function(pattern) {

    const files = glob.sync(pattern, {
      cwd: cwd
    });

    files.forEach(function(f) {
      const original = f;
      const src = self.home + '/app/' + f;
      const hash = util.Hash.file(src);

      // setup rev map
      const parsed = path.parse(f);
      const hashed = fmt('%s/%s_%s%s', parsed.dir, parsed.name, hash, parsed.ext);
      debug('%s -> %s', original, hashed);
      rev[original] = hashed;

      // write file
      const dest = self.buildDir + '/' + hashed;
      fs.copySync(src, dest);
    });
  });
};

/**
 * less
 *
 * 处理less, 替换图片资源等
 */
exports.buildLessAsync = co.wrap(function*(globPatterns, rev, options) {
  const self = this;
  const cwd = this.home + '/app';
  const debug = require('debug')('predator:build:buildLessAsync');

  for (let i = 0; i < globPatterns.length; i++) {
    const pattern = globPatterns[i];
    const files = glob.sync(pattern, {
      cwd: cwd
    });

    for (let j = 0; j < files.length; j++) {
      const f = files[j];

      // build hash
      const src = self.home + '/app/' + f;
      let content = yield self.renderLessAsync(src, options);
      content = util.processRev(content, rev);

      // compute hash
      const hash = Hash.string(content);

      // f是文件, .less
      // original -> hashed, original 应为请求的css地址
      const parsed = path.parse(f);
      const original = fmt('%s/%s%s', parsed.dir, parsed.name, '.css');
      const hashed = fmt('%s/%s_%s%s', parsed.dir, parsed.name, hash, '.css');
      debug('%s -> %s', original, hashed);
      rev[original] = hashed;

      // write file
      const dest = self.buildDir + '/' + hashed;
      fs.outputFileSync(dest, content);
    }
  }
});


exports.buildJsAsync = co.wrap(function*(globPatterns, rev) {
  const self = this;
  const cwd = this.home + '/app';
  const debug = require('debug')('predator:build:buildJsAsync');

  for (let i = 0; i < globPatterns.length; i++) {
    const pattern = globPatterns[i];

    const files = glob.sync(pattern, {
      cwd: cwd
    });

    for (let j = 0; j < files.length; j++) {
      let f = files[j];
      if (f === 'global/js/main/index.json') { // hack on global js
        f = 'global/js/main/index.js';
      }
      const original = f;

      // build hash
      const src = self.home + '/app/' + f;

      // bundle
      const b = self.createBrowserify(src);
      let content = (yield b.bundleAsync()).toString('utf8');

      // process rev
      content = util.processRev(content, rev);

      // minify
      content = UglifyJs.minify(content, {
        fromString: true
      }).code;

      // do rev
      const hash = Hash.string(content);
      const parsed = path.parse(original);
      const hashed = fmt('%s/%s_%s%s', parsed.dir, parsed.name, hash, '.js');
      debug('%s -> %s', original, hashed);
      rev[original] = hashed;

      // write file
      const dest = self.buildDir + '/' + hashed;
      fs.outputFileSync(dest, content, 'utf8');
    }
  }
});

/**
 * 处理视图
 *
 * 只替换资源
 */
exports.buildView = function(globPatterns, rev) {
  const self = this;
  const cwd = this.home + '/app';
  const debug = require('debug')('predator:build:buildView');

  globPatterns.forEach(function(pattern) {
    const files = glob.sync(pattern, {
      cwd: cwd
    });

    files.forEach(function(f) {
      const file = self.home + '/app/' + f;
      let content = fs.readFileSync(file, 'utf8');
      content = util.processRev(content, rev);
      content = content.replace(/\/view(?=\/)/g, '/view_build');

      // write file
      const dest = file.replace(/\/view(?=\/)/, '/view_build');
      debug('%s -> %s', file, dest);
      fs.outputFileSync(dest, content, 'utf8');
    });
  });
};

/**
 * 不带 main 的 js/css
 *
 */
exports.buildOtherJsCss = function(globPatterns, rev) {
  const cwd = this.home + '/app';
  const self = this;
  const debug = require('debug')('predator:build:buildOtherJsCss');

  globPatterns.forEach(function(pattern) {
    const files = glob.sync(pattern, {
      cwd: cwd
    });

    files.forEach(function(f) {
      // do rev
      const original = f;
      const src = cwd + '/' + f;
      let content = fs.readFileSync(src, 'utf8');
      content = util.processRev(content, rev);
      const hash = Hash.string(content);
      const parsed = path.parse(original);
      const hashed = fmt('%s/%s_%s%s', parsed.dir, parsed.name, hash, parsed.ext);
      rev[original] = hashed;
      debug('%s -> %s', original, hashed);

      // write file
      const dest = self.buildDir + '/' + hashed;
      fs.outputFileSync(dest, content);
    });
  });
};

/**
 * build static html
 *
 * 规则是 `/` 结尾, + index.html
 * / -> /index.html
 * /foo/ -> /foo/index.html
 * /bar -> /bar
 */
exports.buildHtmlAsync = co.wrap(function*(paths, options) {
  const debug = require('debug')('predator:build:html');

  const server = this.app.listen(0);
  const address = server.address();
  const serverAddress = 'localhost:' + address.port;
  debug('server address : %s', serverAddress);

  try {
    // build all
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];

      let html = yield request
        .get(serverAddress + path)
        .endAsync()
        .then(function(res) {
          return res.text;
        });

      // options
      const defaults = {};
      options = _.merge(defaults, options);
      try {
        html = minify(html, options);
      } catch (e) {
        console.error('minify failed for : %s', path);
        console.error(e.stack || e);
      }

      // dest
      let dest = this.buildDir + path;
      if (dest.endsWith('/')) {
        dest += 'index.html';
      }

      // debug
      debug('%s -> %s', path, dest);

      // write
      fs.outputFileSync(dest, html);
    }
  } catch (e) {
    server.unref();
    throw e;
  }

  // unref
  server.unref();
});