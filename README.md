## 项目说明
此项目服务于 [postcss-jingoal-sprite](https://github.com/jingoal-chengdu/postcss-jingoal-sprite)
## 项目用途
用于将多个图片合并成一个图片, 并生成对应的json map
## 代码实例
```
var sprite = require('jingoal-sprite');
/*生成sprite*/
gulp.task('spritetask', ["sasstask","fileMap"], function () {
    sprite.createSprite(function () {
        gulp.src(appPath + '/dest/css/*.css')
            .pipe(postcss([
                require('postcss-jingoal-sprite')
            ]))
            .pipe(gulp.dest(appPath + '/dest/css'));
    });
});
```