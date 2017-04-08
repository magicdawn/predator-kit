# predator-kit

[![Greenkeeper badge](https://badges.greenkeeper.io/magicdawn/predator-kit.svg)](https://greenkeeper.io/)
Basic lib for predator style FE project

[![Build Status](https://img.shields.io/travis/magicdawn/predator-kit.svg?style=flat-square)](https://travis-ci.org/magicdawn/predator-kit)
![](https://img.shields.io/npm/v/predator-kit.svg?style=flat-square)
![](https://img.shields.io/node/v/predator-kit.svg?style=flat-square)
![](https://img.shields.io/npm/dm/predator-kit.svg?style=flat-square)
![](https://img.shields.io/npm/dt/predator-kit.svg?style=flat-square)
![](https://img.shields.io/npm/l/predator-kit.svg?style=flat-square)

## Develop

|commands| What |
|---|---|
|`npm run test` | test the predator-kit |
|`npm run test:lib` | test as middleware |
|`npm run test:build`| test as build kit |
|`npm run gulp <task>` | clean the  build in the `test` dir
|`npm run update-deps` | update demo's package.json to use predator-kit@latest
|`npm run use-ln` | use `npm link predator-kit` in demo.

1. 使用 `npm link use-ln` 进行开发
2. 手动修改版本, kit的版本升级 & demo依赖的kit版本升级
3. 推送新版本至npm
4. 推送至GitHub, 触发CI. (4 & 5 不能更换, 因为先触发CI的话, demo下载不到kit新版本, 会失败)

### yeoman-generator
see https://github.com/magicdawn/generator-predator


## API

### as middleware

1. startAssetsManager # start assets manager
2. loadAllRouter # load all router

### as build kit
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