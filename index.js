// Load in our dependencies 
var through = require('through2');
var Pixelsmith = require('pixelsmith');
var concat = require('concat-stream');
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var gutil = require('gulp-util');
var pixelsmith = new Pixelsmith();
/*file类*/
function ImgFile(name,width,height,buffer){
  this.name = name;
  this.width = width;
  this.height = height;
  this.x = 0;
  this.y = 0;
  this.buffer=buffer;
}
/*图片宽度管理器*/
var widthManger = (function(){
  var widthTypes=[];
  return {
    add:function(width){
      if(widthTypes.filter(function(value){
        return value.width==width;
      }).length==0){
        var imgX=0;
        if(widthTypes.length>0){
          var prev = widthTypes[widthTypes.length-1];
          imgX = prev.x+prev.width;
          while(imgX%2!==0) imgX+=1;
        }
        widthTypes.push({
          width:width,
          x:imgX
        });
      }
    },
    getX:function(width){
      var result=0;
      widthTypes.forEach(function(value){
        if(value.width==width){
          result=value.x;
        }
      });
      return result;
    },
    getTotalWidth:function(){
      var last=widthTypes[widthTypes.length-1];
      return last.x+last.width;
    }
  }
}());
//图片分类管理器,根据宽度分类
var fileManger = (function(){
  var fileTypes={},maxY=0;
  return {
    add:function(file){
      var fileWidth = file.width;
      widthManger.add(fileWidth);
      if(typeof fileTypes[fileWidth] == "undefined"){
        fileTypes[fileWidth]=[];
      }
      var imgY=0;
      var childsContainer = fileTypes[fileWidth];
      if(childsContainer.length>0){
        var last = childsContainer[childsContainer.length-1];
        imgY = last.y + last.height;
        while(imgY%2!==0) imgY+=1;
        if(imgY+last.height>maxY){
          maxY = imgY+last.height;
        }
      }
      file.x = widthManger.getX(fileWidth);
      file.y = imgY;
      fileTypes[fileWidth].push(file);
    },
    getMaxY:function(){
      return maxY;
    },
    createFile:function(filepath,callback){
      var _this=this;
      pixelsmith.createImages([filepath], function handleImages (err, imgs) {
        if (err) {
          throw err;
        }
        var img=imgs[0];
        _this.add(new ImgFile(filepath.replace(/\\/g, "/").replace("/2x/","/1x/"), img.width, img.height, img));
        callback();
      })
    },
    getAllFiles:function(){
      return fileTypes;
    }
  }
}());
// through2 是一个对 node 的 transform streams 简单封装
var fileMap={},currentDir;//最终map
function writeFileMap(filepath,callback){//创建文件map
  fileManger.createFile(filepath,callback);
}
function createSprite(callback){//根据map生成sprite
  destpath = path.normalize(currentDir+"/../sprite");
  if(!fs.existsSync(destpath)){
    fs.mkdirSync(destpath);
  }
  var canvas = pixelsmith.createCanvas(widthManger.getTotalWidth(), fileManger.getMaxY());
  var allFiles = fileManger.getAllFiles();
  for(var i in allFiles){
    allFiles[i].forEach(function(img,key){
      canvas.addImage(img.buffer, img.x, img.y);
      var imgName = path.resolve(img.name).replace(/\\/g,"/");
      fileMap[imgName] = {
        width:img.width,
        height:img.height,
        x:img.x/2,
        y:img.y/2
      }
    });
  }
  // Export canvas to image 
  var imageStream = canvas['export']({format: 'png'});
  imageStream.pipe(concat(function handleResult (image) {
    fs.writeFileSync(destpath+"/2x.png",image);
    gm(destpath+"/2x.png").size(function(err,value){
      this.thumb(value.width/2, value.height/2, destpath+"/1x.png", 100, function(){
        fs.writeFileSync(destpath+"/map.json",new Buffer(JSON.stringify(fileMap,false,4)));
        callback&&callback();
      });
    });
  }));
}
// 插件级别函数 (处理文件)
function gulpPrefixer() {
  // 创建一个让每个文件通过的 stream 通道
  return through.obj(function(file, enc, cb) {
    currentDir=path.dirname(file.path);
    writeFileMap(file.path, function(){
      cb(null,file);
    });
  });
};

// 暴露（export）插件主函数
module.exports = {
  fileMap:gulpPrefixer,
  createSprite:createSprite
};
