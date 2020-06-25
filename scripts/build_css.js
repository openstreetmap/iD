/* eslint-disable no-console */
const colors = require('colors/safe');
const concat = require('concat-files');
const glob = require('glob');
const fs = require('fs');
const postcss = require('postcss');
const prepend = require('postcss-selector-prepend');
const autoprefixer = require('autoprefixer');

let _currBuild = null;

// if called directly, do the thing.
if (process.argv[1].indexOf('build_css.js') > -1) {
  buildCSS();
} else {
  module.exports = buildCSS;
}


function buildCSS() {
  if (_currBuild) return _currBuild;

  const START = '🏗   ' + colors.yellow('Building css...');
  const END = '👍  ' + colors.green('css built');

  console.log('');
  console.log(START);
  console.time(END);

  return _currBuild =
    Promise.resolve()
      .then(() => doGlob('css/**/*.css'))
      .then(files => doConcat(files, 'dist/iD.css'))
      .then(() => {
        const css = fs.readFileSync('dist/iD.css', 'utf8');
        return postcss([
            autoprefixer,
            prepend({ selector: '.ideditor ' })
          ])
          .process(css, { from: 'dist/iD.css', to: 'dist/iD.css' });
      })
      .then(result => fs.writeFileSync('dist/iD.css', result.css))
      .then(() => {
        console.timeEnd(END);
        console.log('');
        _currBuild = null;
      })
      .catch(err => {
        console.error(err);
        console.log('');
        _currBuild = null;
        process.exit(1);
      });
}


function doGlob(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

function doConcat(files, output) {
  return new Promise((resolve, reject) => {
    concat(files, output, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
