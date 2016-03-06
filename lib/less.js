'use strict';

/**
 * less
 */
const kit = require('needle-kit');
const Promise = kit.Promise;
const co = kit.co;
const fs = kit.fs;
const _ = require('lodash');
const pathFn = require('path');
const Debug = require('debug'); // debug factory

// less
const less = require('less');
less.renderAsync = Promise.promisify(less.render);
const AutoPrefix = require('less-plugin-autoprefix');
const NpmImport = require('less-plugin-npm-import');
const CleanCss = require('less-plugin-clean-css');

// get default options
const getDefaultOPtions = () => {
  const env = process.env.NODE_ENV || 'development';
  const options = {
    plugins: [
      new AutoPrefix({
        browsers: 'last 10 versions'
      }),
      new NpmImport() // prefix - default: npm://
    ]
  };

  // development
  //  - sourceMaps
  if (env === 'development') {
    options.sourceMap = options.sourceMap || {};
    options.sourceMap.sourceMapFileInline = true;
  }

  // production
  //  - no sourceMaps
  //  - CleanCss
  if (env === 'production') {

    // no sourceMaps
    delete options.sourceMaps;

    // CleanCss
    options.plugins.push(new CleanCss({
      advanced: true
    }));
  }

  return options;
};

exports.renderFileAsync = co.wrap(function*(options) {
  // read
  const content = yield fs.readFileAsync(options.filename, 'utf8');
  const debug = Debug('predator:less');

  /**
   * options 现有
   * 	- filename
   * 	- paths
   *
   * 设置 plugins
   * 	- 共用
   * 		- autoprefix
   * 		- npm import
   * 	- development
   * 		- sourceMaps
   * 	- production
   * 		- clean css
   */
  options = _.merge(getDefaultOPtions(), options);

  // render
  let output;

  try {
    debug('render options %j', options);
    output = yield less.renderAsync(content, options);
  } catch (e) {
    e.message = less.formatError(e);
    throw e;
  }

  // return
  return output.css;
});