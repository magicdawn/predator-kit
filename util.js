/**
 * util
 *
 * like `copy` `hash`
 */

/**
 * module dependencies
 */

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
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