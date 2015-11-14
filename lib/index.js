'use strict';

/**
 * module dependencies
 */
global.Promise = require('bluebird');
const co = require('co');
const pathFn = require('path');
const fs = require('fs');
const _ = require('lodash');
const send = require('koa-send');
const glob = require('glob');
const swig = require('swig');
const browserify = require('browserify');
const stringify = require('stringify');
const Router = require('impress-router');

/**
 * set swig view cache
 */
swig.setDefaults({
  cache: process.env.NODE_ENV === 'production' && 'memory'
});

/**
 * do exports
 */
exports = module.exports = Predator;
const less = exports.less = require('./less');

/**
 * Preadtor class def
 *
 * options
 *   - home: 主目录
 *   - app: koa app
 *   - buildDir: build static files
 */
function Predator(options) {
  if (!(this instanceof Predator)) {
    return new Predator(options);
  }

  if (!options || !options.app) {
    throw new Error('options.app is required');
  }

  // 主目录
  this.home = pathFn.resolve(options.home || '.');

  // app
  this.app = options.app;

  // build 目录
  this.buildDir = pathFn.resolve(options.buildDir || './public');
}

/**
 * serve static file when dev
 *
 * @example
 *
 * router.use('/:component/img', predator.static());
 */
Predator.prototype.static = function() {
  const self = this;
  const root = pathFn.join(this.home, 'app');

  return function* predatorStatic(next) {

    // koa-send
    const filePath = yield send(this, this.originalPath, {
      root: root
    });

    // 304 在 dev 环境下也是更快的
    if (this.fresh) {
      this.status = 304;
      this.body = null;
    }
  };
};

/**
 * load all router
 */
Predator.prototype.loadAllRouter = function() {
  const self = this;

  const routers = glob.sync('app/*/index.js', {
    cwd: this.home
  });

  routers.forEach(function(item) {
    const router = require(self.home + '/' + item);
    self.app.use(router);
  });
};

/**
 * less生成器
 */
Predator.prototype.renderLessAsync = co.wrap(function*(file, options) {
  options = options || {};

  // filename
  options.filename = file;

  // search paths
  options.paths = [
    '.',
    pathFn.join(this.home, 'app')
  ];

  return yield less.renderFileAsync(options);
});

/**
 * for js middleware use
 */

Predator.prototype.createBrowserify = function(file) {
  if (!this.jsGlobals) {
    this.jsGlobals = require(this.home + '/app/global/js/main/index.json');
  }

  // when not production, enable source maps
  const env = process.env.NODE_ENV;

  // b as ret
  let b;

  // global
  if (file === this.home + '/app/global/js/main/index.js') {
    b = browserify({
      basedir: pathFn.dirname(file),
      debug: env !== 'production'
    });

    this.jsGlobals.forEach(function(item) {
      b.require(item.require, {
        expose: item.expose
      });
    });
  } else {

    // normal js
    b = browserify(file, {
      basedir: pathFn.dirname(file),
      debug: env !== 'production'
    });

    this.jsGlobals.forEach(item => b.external(item.expose));
  }

  // commom operation
  b.transform(stringify({
    extensions: ['.html', '.swig', '.tpl', '.txt']
  }));

  // ret
  return b;
};


/**
 * use for js dev env
 */
Predator.prototype.createBrowserifyStream = function(file) {
  return this.createBrowserify(file).bundle();
};


/**
 * development assets manager
 */
Predator.prototype.startAssetsManager = function() {
  const predator = this;
  const home = this.home;

  // router
  const router = Router();
  this.app.use(router);

  // debug
  const debugLess = require('debug')('predator:less');
  const debugBrowserify = require('debug')('predator:browserify');

  /**
   * img fonts assets
   */
  router.use('/:component/fonts', predator.static());
  router.use('/:component/assets', predator.static());
  router.use('/:component/img', predator.static());

  /**
   * less
   *
   * only `css/main/*.css` should be handled via less
   */
  router.get('/:component/css/:css+.css', function*(next) {
    if (_.startsWith(this.params.css, 'main/')) {
      const appHome = pathFn.join(home, 'app');
      const parsed = pathFn.parse(this.originalPath);
      const lessFile = pathFn.join(appHome, parsed.dir, parsed.name + '.less');
      debugLess('%s -> %s', this.path, lessFile);

      this.type = 'css';
      this.body = yield predator.renderLessAsync(lessFile);
    } else {
      yield * next;
    }
  }, predator.static());

  /**
   * js
   *
   * only `js/main/*.js` should be handled via browserify
   */
  router.get('/:component/js/:js+.js', function*(next) {
    if (_.startsWith(this.params.js, 'main/')) {
      const appHome = pathFn.join(home, 'app');
      const parsed = pathFn.parse(this.originalPath);
      const jsFile = pathFn.join(appHome, parsed.dir, parsed.name + parsed.ext);
      debugBrowserify('%s -> %s', this.path, jsFile);

      this.type = 'js';
      this.body = predator.createBrowserifyStream(jsFile); // stream
    } else {
      yield * next;
    }
  }, predator.static());
};

/**
 * get render for context
 *
 * @example
 * Predator.getRender(__dirname)
 */
Predator.getRender = function(dir) {
  const env = process.env.NODE_ENV;
  let base;

  // decide view base
  if (env === 'production') {
    base = pathFn.join(dir, 'view_build');
  } else {
    base = pathFn.join(dir, 'view');
  }

  // render
  return function redner(view, locals) {
    return new Promise(function(resolve, reject) {

      // fix, 在js 中 yield render('../../global/view/error') case
      if (env === 'production') {
        view = view.replace(/\/view(?=\/)/g, '/view_build');
      }

      view = pathFn.join(base, view);
      if (!pathFn.extname(view)) {
        view += '.swig';
      }

      // renderFile
      swig.renderFile(view, locals, function(err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  };
};

/**
 * load build actions
 */
const build = require('./build');
_.assign(Predator.prototype, build);