从jingoal-sprite代码库Fork而来，由Jingoal成都团队维护

## 项目说明
此项目服务于 [postcss-jingoal-sprite-cd](https://github.com/jingoal-chengdu/postcss-jingoal-sprite-cd)
## 项目用途
用于将多个图片合并成一个图片, 并生成对应的json map
## 代码实例
```
var sprite = require('jingoal-sprite-cd');
/*生成sprite*/
gulp.task('spritetask', ["sasstask","fileMap"], function () {
    sprite.createSprite(function () {
        gulp.src(appPath + '/dest/css/*.css')
            .pipe(postcss([
                require('postcss-jingoal-sprite-cd')
            ]))
            .pipe(gulp.dest(appPath + '/dest/css'));
    });
});
```