// Dependencies
const assetCache = require('../index');
const chai = require('chai');
const gutil = require('gulp-util');
const fs = require('fs');

const expect = chai.expect;

// Utility Functions
const throwErr = function (err) {
  if (err) throw err;
};

describe('gulp-asset-cache', function () {
  const testFoo = 'test/fixtures/foo.jpg';
  const testBar = 'test/fixtures/bar.jpg';
  const testBaz = 'test/fixtures/baz.jpg';
  const fileFoo = new gutil.File({ path: `./${testFoo}`, contents: Buffer.from('Foo'), stat: { size: 100 } });
  const fileBar = new gutil.File({ path: `./${testBar}`, contents: Buffer.from('Bar'), stat: { size: 100 } });
  const fileBaz = new gutil.File({ path: `./${testBaz}`, contents: Buffer.from('Baz'), stat: { size: 100 } });

  describe('without a cache file', function () {
    beforeEach(function () {
      // Reset Cache stored in mem
      assetCache.currentCache = {};
    });

    /**
     * Test 1 - Default cache file should be created with the keys of foo.jpg and bar.jpg
     * @results Test confirms that the default file is being written with new files being added
     */
    it('Default file should be created with Foo and Bar', function (done) {
      const stream = assetCache.filter();
      stream.pipe(assetCache.cache());

      stream.on('finish', function () {
        // Add a dealy to make sure the file is finished writing before reading
        setTimeout(function run() {
          fs.readFile('./.asset-cache', 'utf8', function (err, data) {
            throwErr(err);
            expect(JSON.parse(data)).to.have.keys([testFoo, testBar]);
            done();
          });
        }, 500);
      });

      stream.write(fileFoo);
      stream.write(fileBar);
      stream.end();
    });

    /**
     * Test 2 - Cache file should be created with the keys of foo.jpg, bar.jpg, and baz.jpg
     * @results Test confirms that file is being written with new files being added
     */
    it('Foo, Bar, and Baz should show as uncached and be added to a specified cache file', function (done) {
      const stream = assetCache.filter('./test/.test-new-cache');
      stream.pipe(assetCache.cache());

      stream.on('finish', function () {
        // Add a delay to make sure the file is finished writing before reading
        setTimeout(function () {
          fs.readFile('./test/.test-new-cache', 'utf8', function (err, data) {
            throwErr(err);
            expect(JSON.parse(data)).to.have.keys([testFoo, testBar, testBaz]);
            done();
          });
        }, 500);
      });

      stream.write(fileFoo);
      stream.write(fileBar);
      stream.write(fileBaz);
      stream.end();
    });

    // After - Clean up test directory
    after(function () {
      fs.unlink('./test/.test-new-cache', throwErr);
      fs.unlink('./.asset-cache', throwErr);
    });
  });

  describe('with an existing cache', function () {
    // Before - Set up Existing Cache Files for testing
    before(function () {
      fs.writeFile('./test/.test-update-cache', JSON.stringify({
        'test/fixtures/foo.jpg': '9a00e3f54e6a23ee446348a075ddcfb1'
      }, null, 4), 'utf8', throwErr);
      fs.writeFile('./test/.test-stored-cache', JSON.stringify({
        'test/fixtures/foo.jpg': 'b432aa22f80486078aa53e6e5c64ddb3',
        'test/fixtures/bar.jpg': '976c38a5095dc3dd31c85e2ca1fbbc50'
      }, null, 4), 'utf8', throwErr);
    });

    // Reset Cache in mem
    beforeEach(function () {
      assetCache.currentCache = {};
    });

    /**
     * Test 2 - foo.jpg should be removed from the cache, and bar.jpg and baz.jpg should be added
     * @results Test confirms that files are both being added and removed from the cache
     */
    it('Bar and Baz should be added to a stored cache file, Foo should be removed.', function (done) {
      const stream = assetCache.filter('./test/.test-update-cache');
      stream.pipe(assetCache.cache());

      stream.on('finish', function () {
        // Add a delay to make sure the file is finished writing before reading
        setTimeout(function () {
          fs.readFile('./test/.test-update-cache', 'utf8', function (err, data) {
            throwErr(err);
            const cacheObj = JSON.parse(data);
            expect(cacheObj).to.have.keys([testBar, testBaz]);
            expect(cacheObj).to.not.have.keys([testFoo]);
            done();
          });
        }, 500);
      });

      stream.write(fileBar);
      stream.write(fileBaz);
      stream.end();
    });

    /**
     * Test 3 - foo.jpg and bar.jpg should be recognized as cached while baz.jpg should be uncached
     * @results Test confirms that files are being recognized properly when cached
     */
    it('Foo and Bar should show as cached while Baz is uncached and added to the cache file.', function (done) {
      const stream = assetCache.filter('./test/.test-stored-cache');
      stream.pipe(assetCache.cache());

      stream.on('finish', function () {
        // Add a delay to make sure the file is finished writing before reading
        setTimeout(function () {
          fs.readFile('./test/.test-stored-cache', 'utf8', function (err, data) {
            throwErr(err);
            expect(JSON.parse(data)).to.have.keys([testFoo, testBar, testBaz]);
            done();
          });
        }, 500);
      });

      stream.write(fileFoo);
      stream.write(fileBar);
      stream.write(fileBaz);
      stream.end();
    });

    // After - Clean up test directory
    after(function () {
      fs.unlink('./test/.test-update-cache', throwErr);
      fs.unlink('./test/.test-stored-cache', throwErr);
    });
  });
});
