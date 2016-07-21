#gulp-asset-cache
[![Build Status](https://travis-ci.org/Polyneue/gulp-asset-cache.svg?branch=master)](https://travis-ci.org/Polyneue/gulp-asset-cache)
[![Coverage Status](https://coveralls.io/repos/github/Polyneue/gulp-asset-cache/badge.svg?branch=master)](https://coveralls.io/github/Polyneue/gulp-asset-cache?branch=master)  

A disk based caching task for [gulp](http://gulpjs.com/). This plugin was built mainly to deal with the issues around having no dist directory and wanting to prevent image/video compression from happening multiple times on larger teams. If you do have the luxury of a src/dist file structure I recommend [gulp-changed](https://www.npmjs.com/package/gulp-changed) or [gulp-newer](https://www.npmjs.com/package/gulp-newer) as they easily integrate with that setup.

##Installation
Install package with NPM and add it to your development dependencies:  

```
npm install --save-dev gulp-asset-cache
```

##Usage
```javascript
var gulp = require('gulp'),
	imagemin = require('gulp-imagemin'),
	assetCache = require('gulp-asset-cache');

gulp.task('images', function() {
	return gulp.src('./images/*.{jpg,png,jpeg,gif,svg'})
		// Specify the location and name of the cache file
		.pipe(assetCache.filter('./images/.image-cache'))
		.pipe(imagemin({
			verbose: true
		}))
		.pipe(assetCache.cache());
		.pipe(gulp.dest('./images/'))
});
```

This will create a cache file named `.image-cache` of all files passed through the pipeline to be excluded from subsequent runs. If a file that has been cached is updated, the cache will recognize this and pass the file through to update it in the cache.

##API
###assetCache.filter(cacheName)
**cacheName**  (optional)  
Type: `string` Default: `./asset-cache`  
cacheName should be the name and location of where the cache file will live.

###assetCache.cache()
Create or update the currently streamed cache file. 

##Tests
```
npm test
```


##License
[The MIT License(MIT)](https://github.com/Polyneue/gulp-asset-cache/blob/master/LICENSE)  

Copyright (c) 2016 [Ed Mendoza](http://www.edmendoza.com)