'use strict';

// Dependencies
var assetCache = require('../index'),
	chai = require('chai'),
	gutil = require('gulp-util'),
	fs = require('fs'),
	expect = chai.expect;

describe('gulp-asset-cache', function() {
	var cacheNewTest = './test/.test-new-cache',
		cacheExistingTest = './test/.test-existing-cache',
		fileOne = new gutil.File({ path: './test/foo.png', contents: new Buffer('Foo') }),
		fileTwo = new gutil.File({ path: './test/deep/bar.jpg', contents: new Buffer('Bar') }),
		fileThree = new gutil.File({ path: './test/baz.gif', contents: new Buffer('Baz') });

	describe('with an existing cache', function() {

		it('should filter files out of the pipe and pass on uncached ones', function(done) {
			var stream = assetCache(cacheExistingTest);

			stream.pipe(gutil.buffer(function(err, files) {
				expect(files).to.not.have.keys(['./test/deep/bar.jpg']);
				done();
				// Reset test file
				fs.writeFile(cacheExistingTest, '{"test/foo.png":"9a00e3f54e6a23ee446348a075ddcfb1"}', 'utf8');
			}));

			stream.write(fileOne);
			stream.write(fileTwo);
			stream.end();
		});

		it('should update the cache with piped files', function(done) {
			var stream = assetCache(cacheExistingTest);

			stream.on('finish', function() {
				fs.readFile(cacheExistingTest, 'utf8', function(err, data) {
					var cacheObj = JSON.parse(data);
					expect(cacheObj).to.have.keys(['test/deep/bar.jpg', 'test/baz.gif']);
					expect(cacheObj).to.not.have.keys(['test/foo.png']);
					done();
				});
				
				// Reset test file
				fs.unlink(cacheExistingTest, function() {
					fs.writeFile(cacheExistingTest, '{"test/foo.png":"9a00e3f54e6a23ee446348a075ddcfb1"}', 'utf8');
				})
			});

			stream.write(fileTwo);
			stream.write(fileThree);
			stream.end();
		});
	});

	describe('without a cache', function() {

		it('should create a cache file and populate with piped files', function(done) {
			var stream = assetCache(cacheNewTest);

			stream.on('finish', function() {
				fs.readFile(cacheNewTest, 'utf8', function(err, data) {
					expect(JSON.parse(data)).to.have.keys(['test/foo.png', 'test/deep/bar.jpg']);
					done();
				});
				// Remove test File
				fs.unlink(cacheNewTest);
			});

			stream.write(fileOne);
			stream.write(fileTwo);
			stream.end();
		});

		it('should create a default test file and populate with piped files', function(done) {
			var stream = assetCache();

			stream.on('finish', function() {
				fs.readFile('./.asset-cache', 'utf8', function(err, data) {
					expect(JSON.parse(data)).to.have.keys(['test/foo.png', 'test/deep/bar.jpg'])
					done();
				})

				// Remove test file
				fs.unlink('./.asset-cache');
			});

			stream.write(fileOne);
			stream.write(fileTwo);
			stream.end();
		});
	});
});