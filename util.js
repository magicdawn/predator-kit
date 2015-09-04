/**
 * util
 *
 * like `copy` `hash`
 */

/**
 * module dependencies
 */

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var mkdirpSync = mkdirp.sync;
var Promise = require('bluebird');
var crypto = require('crypto');
var escapeRegexp = require('escape-regexp');
var Browserify = require('browserify');
var _ = require('lodash');


/**
 * browseridy bundle(function(err,res){  })
 */
Browserify.prototype.bundleAsync = Promise.promisify(Browserify.prototype.bundle);

/**
 * copy
 */

exports.copy = function(src, dest) {
  src = path.resolve(src);
  dest = path.resolve(dest);

  if (!fs.existsSync(src)) {
    console.warn('copy none exists: %s', src);
    return;
  }

  // guard dir
  exports.ensureDir(dest);

  // stream
  return new Promise(function(resolve, reject) {
    fs.createReadStream(src)
      .on('error', reject)
      .pipe(fs.createWriteStream(dest))
      .on('error', reject)
      .on('finish', resolve);
  });
};

/**
 * get md5 of content
 */
exports.Hash = {

  /**
   * for file
   */
  file: function(file) {
    file = path.resolve(file);

    // text ?
    var textExts = ['.css', '.js', '.html', '.less', '.json'];
    var ext = path.extname(file);
    var isText = textExts.indexOf(ext) > -1;

    // content
    var content;
    if (isText) {
      content = fs.readFileSync(file, 'utf8');
    } else {
      content = fs.readFileSync(file);
    }
    var hash = require('crypto').createHash('md5').update(content).digest('hex');
    return hash.substr(0, 8);
  },

  /**
   * for string
   */
  string: function(s) {
    return require('crypto').createHash('md5').update(s).digest('hex').substr(0, 8);
  }
};

/**
 * 根据rev map 替换资源
 */
exports.processRev = function(content, rev) {
  // replace with hashed resource
  _.forOwn(rev, function(hashed, original) { // value,key
    var reg = new RegExp(escapeRegexp(original), 'g');
    content = content.replace(reg, hashed);
  });

  return content;
};

/**
 * 保证文件夹存在
 */
exports.ensureDir = function(dir) {
  if (path.extname(dir)) {
    dir = path.dirname(dir);
  }

  if (!fs.existsSync(dir)) {
    mkdirpSync(dir);
  }
};