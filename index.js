'use strict';

// Dependencies
var fs = require('fs'),
	through = require('through2'),
	path = require('path'),
	gutil = require('gulp-util'),
	md5 = require('md5');

// Helpers
var PluginError = gutil.PluginError,
	gc = gutil.colors;

// Constants
const PLUGIN_NAME = 'gulp-asset-cache';

/**
 * Create a cache file for filtering
 * @param {string} cacheName - Path to cache file
 * @return stream
 */
var assetCache = function(cacheName) {
	var currentCache = {},
		cacheFile = {};

	// Set default cache if not specified
	if (!cacheName) {
		cacheName = './.asset-cache';
	}
	
	// Try to load an existing cache file
	try {
		cacheFile = JSON.parse(fs.readFileSync(cacheName));
	} catch (err) {
		cacheFile = {};
	}

	/**
	 * Update the cache and pass through uncached files
	 * @param {File} file - A vinyl file
	 * @param {enc} encoding - Encoding (ignored)
	 * @param {function(err, file)} done - Callback
	 */
	function transform(file, enc, cb) {

		if (file.isNull()) {
			return cb();
		}

		if (file.isStream()) {
			throw new PluginError(PLUGIN_NAME, 'Streams not currently supported.');
		}

		if (file.isBuffer()) {
			var relativePath = path.relative(__dirname, path.dirname(file.path)) + '/' + path.basename(file.path),
				hash = md5(relativePath);
			
			// Update cache object
			currentCache[relativePath] = hash;

			if (cacheFile[relativePath] === currentCache[relativePath]) {
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
	}

	/**
	 * Flush updated cache file to disk
	 * @param {function(err, file)} done - Callback
	 */
	function flush(cb) {
		fs.writeFile(cacheName, JSON.stringify(currentCache), cb);
	}

	// Return stream
	return through.obj(transform, flush);
}

// Exports
module.exports = assetCache;