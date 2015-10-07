# predator-kit
Basic lib for predator style FE project

[![Build Status](https://travis-ci.org/magicdawn/predator-kit.svg)](https://travis-ci.org/magicdawn/predator-kit)
![](https://img.shields.io/npm/v/predator-kit.svg)
![](https://img.shields.io/node/v/predator-kit.svg)
![](https://img.shields.io/npm/dm/predator-kit.svg)
![](https://img.shields.io/npm/dt/predator-kit.svg)
![](https://img.shields.io/npm/l/predator-kit.svg)

## Develop

### commands
- `npm run test` # test the predator-kit
- `npm run gulp <task>` # clean the  build in the `test` dir

### yeoman-generator
see https://github.com/magicdawn/generator-predator

## API

### dev

1. startAssetsManager # start assets manager
2. loadAllRouter # load all router

### build
generally: we got build everything ready

1. buildCopy: just copy
2. buildStatic: name_hash.ext
3. buildLessAsync: less -> clean-css
4. buildJsAsync: js -> browserify
5. buildOtherJsCss: css/js not in `main`
6. buildView: we build `view/*.{swig|html|...}`
7. buildHtmlAsync: build static html

## License
MIT http://magicdawn.mit-license.org