'use strict';

// Dependencies
var assetCache = require('../index'),
	chai = require('chai'),
	gutil = require('gulp-util'),
	fs = require('fs'),
	expect = chai.expect;

describe('gulp-asset-cache', function() {
	var fileOne = new gutil.File({ path: './test/fixtures/foo.jpg', contents: new Buffer('Foo'), stat: { size: 100 } }),
		fileTwo = new gutil.File({ path: './test/fixtures/bar.jpg', contents: new Buffer('Bar'), stat: { size: 100 } }),
		fileThree = new gutil.File({ path: './test/fixtures/baz.jpg', contents: new Buffer('Baz'), stat: { size: 100 } });

	describe('without a cache file', function() {

		/*
		 * Test 1 - Create Default Cache
		 * Default cache file should be created with the keys of foo.jpg and bar.jpg
		 * Results - Test confirms that the default file is being written with new files being added
		 */
		it('Default file should be created with Foo and Bar', function(done) {

			// Reset Cache stored in mem
			assetCache.currentCache = {};

			var stream = assetCache.filter();
				stream.pipe(assetCache.cache());

			stream.on('finish', function() {
				// Add a dealy to make sure the file is finished writing before reading
				setTimeout(function() {
					fs.readFile('./.asset-cache', 'utf8', function(err, data) {
						expect(JSON.parse(data)).to.have.keys(['test/fixtures/foo.jpg', 'test/fixtures/bar.jpg']);
						done();
					});
				}, 500);
			});

			stream.write(fileOne);
			stream.write(fileTwo);
			stream.end();
		});


		/*
		 * Test 2 - Create Cache File
		 * Cache file should be created with the keys of foo.jpg, bar.jpg, and baz.jpg
		 * Results - Test confirms that file is being written with new files being added
		 */
		it('Foo, Bar, and Baz should show as uncached and be added to a specified cache file', function(done) {

		 	// Reset Cache stored in Mem
		 	assetCache.currentCache = {}

		 	var stream = assetCache.filter('./test/.test-new-cache');
		 		stream.pipe(assetCache.cache());

		 	stream.on('finish', function() {
		 		// Add a delay to make sure the file is finished writing before reading
	 			setTimeout(function() {
			 		fs.readFile('./test/.test-new-cache', 'utf8', function(err, data) {
			 			expect(JSON.parse(data)).to.have.keys(['test/fixtures/foo.jpg', 'test/fixtures/bar.jpg', 'test/fixtures/baz.jpg']);
			 			done();
			 		});
	 			}, 500);
		 	});

		 	stream.write(fileOne);
		 	stream.write(fileTwo);
		 	stream.write(fileThree);
		 	stream.end();
		});

		// After - Clean up test directory
		after(function() {
			fs.unlink('./test/.test-new-cache');
			fs.unlink('./.asset-cache');
		});
	});

	describe('with an existing cache', function() {

		// Before - Set up Existing Cache Files for testing
		before(function() {
			fs.writeFile('./test/.test-update-cache', JSON.stringify({"test/fixtures/foo.jpg":"9a00e3f54e6a23ee446348a075ddcfb1"}, null, 4), 'utf8');
			fs.writeFile('./test/.test-stored-cache', JSON.stringify({"test/fixtures/foo.jpg": "b432aa22f80486078aa53e6e5c64ddb3","test/fixtures/bar.jpg": "976c38a5095dc3dd31c85e2ca1fbbc50"}, null, 4), 'utf8');
		});

		/*
		 * Test 2 - Update Cache
		 * foo.jpg should be removed from the cache, and bar.jpg and baz.jpg should be added
		 * Results - Test confirms that files are both being added and removed from the cache
		 */
		it('Bar and Baz should show as uncached and be added to a stored cache file, Foo should be removed.', function(done) {

			// Reset Cache stored in Mem
			assetCache.currentCache = {};

			var stream = assetCache.filter('./test/.test-update-cache');
				stream.pipe(assetCache.cache());

			stream.on('finish', function() {
				// Add a delay to make sure the file is finished writing before reading
				setTimeout(function() {
					fs.readFile('./test/.test-update-cache', 'utf8', function(err, data) {
						var cacheObj = JSON.parse(data);
						expect(cacheObj).to.have.keys(['test/fixtures/bar.jpg', 'test/fixtures/baz.jpg']);
						expect(cacheObj).to.not.have.keys(['test/fixtures/foo.jpg']);
						done();
					});
				}, 500);
			});

			stream.write(fileTwo);
			stream.write(fileThree);
			stream.end();
		});

		/*
		 * Test 3 - Recognize Cached Files
		 * foo.jpg and bar.jpg should be recognized as cached while baz.jpg should be uncached
		 * Results - Test confirms that files are being recognized properly when cached
		 */
		 it('Foo and Bar should show as cached while Baz is uncached and added to the cache file.', function(done) {

		 	// Reset Cache stored in Mem
		 	assetCache.currentCache = {};

		 	var stream = assetCache.filter('./test/.test-stored-cache');
		 		stream.pipe(assetCache.cache());

		 	stream.on('finish', function() {
		 		// Add a delay to make sure the file is finished writing before reading
		 		setTimeout(function() {
		 			fs.readFile('./test/.test-stored-cache', 'utf8', function(err, data) {
		 				expect(JSON.parse(data)).to.have.keys(['test/fixtures/foo.jpg', 'test/fixtures/bar.jpg', 'test/fixtures/baz.jpg']);
		 				done();
		 			});
		 		}, 500);
		 	});

		 	stream.write(fileOne);
		 	stream.write(fileTwo);
		 	stream.write(fileThree);
		 	stream.end();
		 });

		// After - Clean up test directory
		after(function() {
			fs.unlink('./test/.test-update-cache');
			fs.unlink('./test/.test-stored-cache');
		});
	});
});