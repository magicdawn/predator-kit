/**
 * module dependencies
 */
global.Promise = require('bluebird');
var co = require('co');
var pathFn = require('path');
var fs = require('fs');
var _ = require('lodash');
var send = require('koa-send');
var glob = require('glob');
var swig = require('swig');
var browserify = require('browserify');
var stringify = require('stringify');

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
var less = exports.less = require('./less');

/**
 * Preadtor class def
 *
 * options
 *   - home: 主目录
 *   - app: koa app
 *   - router: main router
 */
function Predator(options) {
  if (!(this instanceof Predator)) {
    return new Predator(options);
  }

  if (!options || !options.app || !options.router) {
    throw new Error('options.app options.router is required');
  }

  // 主目录
  this.home = pathFn.resolve(options.home || '.');

  // app
  this.app = options.app;

  // rouetr 
  this.router = options.router;

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
  var self = this;
  var root = pathFn.join(this.home, 'app');

  return function * predatorStatic(next) {
    return yield send(this, this.originalPath, {
      root: root
    });
  }
};

/**
 * load all router
 */
Predator.prototype.loadAllRouter = function() {
  var self = this;

  var routers = glob.sync('app/*/index.js', {
    cwd: this.home
  });

  routers.forEach(function(item) {
    var router = require(self.home + '/' + item);
    self.app.use(router);
  });
};

/**
 * less生成器
 */
Predator.prototype.renderLessAsync = co.wrap(function * (file) {
  var env = process.env.NODE_ENV;
  var paths = [
    '.',
    pathFn.join(this.home, 'app')
  ];

  if (env === 'production') {
    return yield less.renderFileAsync(file, {
      paths: paths
    });
  } else {
    return yield less.renderFileAsync(file, {
      sourceMap: {
        sourceMapFileInline: true
      },
      paths: paths,
      compress: true
    });
  }
});

/**
 * for js middleware use
 */

Predator.prototype.createBrowserify = function(file) {
  if (!this.jsGlobals) {
    this.jsGlobals = require(this.home + '/' + 'app/global/js/main/index.json');
  }

  // when not production, enable source maps
  var env = process.env.NODE_ENV;

  // b as ret
  var b;

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


    this.jsGlobals.forEach(function(item) {
      b.external(item.expose);
    });
  }

  // commom operation
  b.transform(stringify({
    extensions: ['.html', '.swig', 'tpl', '.txt']
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
  var router = this.router;
  var predator = this;
  var home = this.home;
  var debug = require('debug')('predator:middleware');

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
  router.get('/:component/css/:css+.css', function * (next) {
    if (_.startsWith(this.params.css, 'main/')) {
      var appHome = pathFn.join(home, 'app');
      var parsed = pathFn.parse(this.originalPath);
      var lessFile = pathFn.join(appHome, parsed.dir, parsed.name + '.less');
      debug('css -> less : %s -> %s', this.path, lessFile);

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
  router.get('/:component/js/:js+.js', function * (next) {
    if (_.startsWith(this.params.js, 'main/')) {
      var appHome = pathFn.join(home, 'app');
      var parsed = pathFn.parse(this.originalPath);
      var jsFile = pathFn.join(appHome, parsed.dir, parsed.name + parsed.ext);
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
  var env = process.env.NODE_ENV;
  var base;

  // decide view base
  if (env === 'production') {
    base = pathFn.join(dir, 'view_build');
  } else {
    base = pathFn.join(dir, 'view');
  }

  // render
  return function redner(view, locals) {
    return new Promise(function(resolve, reject) {
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
  }
};

/**
 * load build actions
 */
var build = require('./build');
_.assign(Predator.prototype, build);