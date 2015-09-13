# predator
Yeah, it's predator

![](http://cdn.list25.com/wp-content/uploads/2013/04/5-predator-b-drone-mq-9-reaper_tn.jpg)


## 命名约定

文件夹, 能单数, 则单数
- img/css/js 常用: 缩写 & 单数
- view 
- fonts, 这个是有些css 引用fonts, 在url写的
- assets, 静态文件

## development

app
  - global
    - css
      - main
        index.less
      foo.css
      bar.css
    - js
      - main
        index.js
      bar.js

- 像 img/assets/fonts 做 serve 静态文件处理
- js/css 带main的做 browserify/less 处理
- js/css 其他情况,做 serve 静态文件处理

## production

public
  - global
    - css # hash处理
      - main
        index_ancsddss.css
      - foo_ewewewef.css
    - js # hash 处理
    - img # hash 处理
    - fonts # 只复制
    - assets # hash处理
    - view # 内容做hash处理

- hash 处理, 表示内容经过hashMap 替换, 本文件加入hashMap处理
    1. assets/fonts/img
    2. css, 主要引用 img
    3. view做内容替换
    3. js, 可能引用partial, 通过 require stringify
- 只复制
- 内容做hash处理, view, 不能修改文件名

## 引用方式

- html引用css/js : `/global/js/main/index.js`
- css互相引用, less render的时候使用了 path= [. , <project_root>/app/]
- 全站, app lib ,软链接至 node_modules