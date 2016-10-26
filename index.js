'use strict';

// Dependencies
var fs = require('fs'),
	through = require('through2'),
	path = require('path'),
	gutil = require('gulp-util'),
	md5 = require('md5');

// Helpers
var gc = gutil.colors,
	PLUGIN_NAME = 'gulp-asset-cache';

var assetCache = {
	cacheFile: {},
	currentCache: {},
	cacheName: false,

	filter: function(cacheName) {

		// Set default cache if not specified
		assetCache.cacheName = cacheName ? cacheName : './.asset-cache';

		// Try to load an existing cache file
		try {
			assetCache.cacheFile = JSON.parse(fs.readFileSync(assetCache.cacheName));
		} catch (err) {
			assetCache.cacheFile = {};
		}

		/**
		 * Update the current cache and filter out cached files
		 * @param {object} file - A vinyl file
		 * @param {string} encoding - Encoding
		 * @param {function} cb - Callback
		 */
		 return through.obj(function(file, enc, cb) {

			if (file.isNull()) {
				return cb();
			}

			if (file.isStream()) {
				this.emit('error', new Error('Streaming not supported in gulp-asset-cache'));
				return cb();
			}

			if (file.isBuffer()) {
				var relativePath = path.relative(process.cwd(), path.dirname(file.path)) + '/' + path.basename(file.path),
					hash = md5(relativePath + file.stat['size']);

				// Update cache object
				assetCache.currentCache[relativePath] = hash;


				if (assetCache.cacheFile[relativePath] === assetCache.currentCache[relativePath]) {
					// Skip cached file
					gutil.log(PLUGIN_NAME + ':' + gc.green(' ✔ ') + relativePath + gc.grey(' (cached)'));
					return cb();
				} else {
					// Push uncached file
					gutil.log(PLUGIN_NAME + ':' + gc.red(' ✖ ') + relativePath + gc.grey(' (uncached)'));
					this.push(file);
					return cb();
				}
			}
		});
	},

	cache: function() {

		/**
		 * Update the current with changed files
		 * @param {object} file - A vinyl file
		 * @param {string} encoding - Encoding
		 * @param {function} cb - Callback
		 */
		function transform(file, enc, cb) {
			var _this = this,
				relativePath = path.relative(process.cwd(), path.dirname(file.path)) + '/' + path.basename(file.path),
				hash = md5(relativePath + fs.lstatSync(file.path));
			
			fs.stat(file.path, function(err, stats) {
				// Update Cache
				var hash = md5(relativePath + stats.size);
				assetCache.currentCache[relativePath] = hash;
				_this.push(file);
				return cb();
			});		
		}

		/**
		 * Flush updated cache file to disk
		 * @param {function} cb - Callback
		 */
		function flush(cb) {
			fs.writeFile(assetCache.cacheName, JSON.stringify(assetCache.currentCache, null, 4), cb);
		}

		return through.obj(transform, flush);
	}
}

// Exports
module.exports = assetCache;