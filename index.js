// Dependencies
const fs = require('fs');
const through = require('through2');
const path = require('path');
const md5 = require('md5');
const chalk = require('chalk');

const assetCache = {
  cacheFile: {},
  currentCache: {},
  cacheName: false,

  filter(cacheName) {
    // Set default cache if not specified
    assetCache.cacheName = cacheName || './.asset-cache';

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
    return through.obj(function (file, enc, cb) {
      if (file.isNull()) {
        return cb();
      }

      if (file.isStream()) {
        this.emit('error', new Error('Streaming not supported in gulp-asset-cache'));
        return cb();
      }

      if (file.isBuffer()) {
        const relativePath = path.relative(process.cwd(), `${path.dirname(file.path)}/${path.basename(file.path)}`);
        const hash = md5(relativePath + file.stat.size);

        // Update cache object
        assetCache.currentCache[relativePath] = hash;

        if (assetCache.cacheFile[relativePath] === assetCache.currentCache[relativePath]) {
          console.log(`gulp-asset-cache: ${chalk.green('✔')} ${relativePath} ${chalk.grey('(cached)')}`);
        } else {
          console.log(`gulp-asset-cache: ${chalk.red('✖')} ${relativePath} ${chalk.grey('(uncached)')}`);
          this.push(file);
        }
      }
      return cb();
    });
  },

  cache() {
    /**
     * Update the current with changed files
     * @param {object} file - A vinyl file
     * @param {string} encoding - Encoding
     * @param {function} cb - Callback
     */
    function transform(file, enc, cb) {
      const self = this;
      const relativePath = path.relative(process.cwd(), `${path.dirname(file.path)}/${path.basename(file.path)}`);

      fs.stat(file.path, function callback(err, stats) {
        if (err) this.emit('error', new Error(err));
        // Update Cache
        const hash = md5(relativePath + stats.size);
        assetCache.currentCache[relativePath] = hash;
        self.push(file);
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
};

// Exports
module.exports = assetCache;
