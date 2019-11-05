/* eslint-disable no-console */
const colors = require('colors/safe');
const concat = require('concat-files');
const glob = require('glob');

let _currBuild = null;

// if called directly, do the thing.
buildCSS();


function buildCSS() {
  if (_currBuild) return _currBuild;

  console.log('building css');
  console.time(colors.green('css built'));

  return _currBuild =
    doGlob('css/**/*.css')
    .then((files) => doConcat(files, 'dist/iD.css'))
    .then(() => {
      console.timeEnd(colors.green('css built'));
      _currBuild = null;
    })
    .catch((err) => {
      console.error(err);
      _currBuild = null;
      process.exit(1);
    });
};


function doGlob(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
};

function doConcat(files, output) {
  return new Promise((resolve, reject) => {
    concat(files, output, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};


module.exports = buildCSS;