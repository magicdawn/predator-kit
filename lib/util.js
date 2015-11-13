'use strict';

/**
 * util
 *
 * like `copy` `hash`
 */

/**
 * module dependencies
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
global.Promise = require('bluebird');
const crypto = require('crypto');
const escapeRegexp = require('escape-regexp');
const Browserify = require('browserify');
const _ = require('lodash');


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
    const textExts = ['.css', '.js', '.html', '.less', '.json'];
    const ext = path.extname(file);
    const isText = textExts.indexOf(ext) > -1;

    // content
    let content;
    if (isText) {
      content = fs.readFileSync(file, 'utf8');
    } else {
      content = fs.readFileSync(file);
    }
    const hash = require('crypto').createHash('md5').update(content).digest('hex');
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
    const reg = new RegExp(escapeRegexp(original), 'g');
    content = content.replace(reg, hashed);
  });

  return content;
};