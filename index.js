// config
var config = require('./config');
var paths = config.paths;

// standard modules
var fs = require('fs');
var path = require('path');
var stream = require('stream');

// vendor modules
var gm = require('gm');
var cv = require('opencv');
var async = require('async');


async.waterfall([
  function(callback){
    fs.readdir(paths.src, function(err, files){
      console.log('Starting!');
      callback(null, files);
    });
  },
  function(files, callback){
    var len = files.length;
    function smartCrop(filename, cb){
      cv.readImage(path.resolve(paths.src, filename), function(err, im){
	im.detectObject(cv.FACE_CASCADE, {}, function(err, results){
	  if(results.length){
	    var tmp, face, cropped, marginX, marginY;
	    var origHeight = im.height();
	    var origWidth = im.width();

	    // the biggest face is usually correct
            for(var i = 0; i < results.length; i++) {
	      tmp = results[i];

	      if(!face || face.width < tmp.width) face = tmp;
            }

	    // enlarge too-tight standard FACE_CASCADE rect
	    marginX = Math.min(origWidth - (face.x + face.width), face.x);
	    marginY = Math.min(origHeight - (face.y + face.height), face.y);
	    cropped = im.roi(face.x - marginX, face.y - marginY, face.width + (marginX * 2) , face.height + (marginY * 2));

	    // could all be done in opencv
	    gm((cropped.toBuffer()))
	      .resize(null, config.height)
	      .gravity('Center')
	      .crop(config.width, config.height)
	      .stream()
	      .pipe(fs.createWriteStream(path.resolve(paths.dist, filename)));
	    
	    len--;
	    console.log('completed ' + filename + ', ' + len + ' files remaining');
	    cb(null);
	  } else {
	    // if there aren't any detected faces just crop to the center and warn about it
	    gm(path.resolve(paths.src, filename))
	      .resize(null, config.height)
	      .gravity('Center')
	      .crop(config.width, config.height)
	      .stream()
	      .pipe(fs.createWriteStream(path.resolve(paths.dist, filename)));
	    
	    len--;
	    console.warn('no face detected in file ' + filename + ', used dumb cropping, ' + len + ' files remaining');
	    cb(null);
	  }
	});
      });
    };

    // not very fast, but it doesn't need to be
    async.eachSeries(files, smartCrop, function(err){
      err && console.log(err);
      callback(null);
    });
  }
], function (err) {
  console.log('finished!');
});
