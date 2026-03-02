/* eslint-disable no-console */
import concat from 'concat-files';
import fs from 'node:fs';
import { styleText } from 'node:util';
import postcss from 'postcss';
import prepend from 'postcss-prefix-selector';
import autoprefixer from 'autoprefixer';

let _currBuild = null;

// if called directly, do the thing.
if (process.argv[1].indexOf('build_css.js') > -1) {
  buildCSS();
}


export function buildCSS() {
  if (_currBuild) return _currBuild;

  const START = '🏗   ' + styleText('yellow', 'Building css...');
  const END = '👍  ' + styleText('green', 'css built');

  console.log('');
  console.log(START);
  console.time(END);

  return _currBuild =
    Promise.resolve()
      .then(() => fs.globSync('css/**/*.css'))
      .then(files => doConcat(files.sort(), 'dist/iD.css'))
      .then(() => {
        const css = fs.readFileSync('dist/iD.css', 'utf8');
        return postcss([
            autoprefixer,
            duplicateDarkMode,
            prepend({ prefix: '.ideditor', exclude: [ /^\.ideditor(\[.*?\])*/ ] })
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


function doConcat(files, output) {
  return new Promise((resolve, reject) => {
    concat(files, output, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}


function duplicateDarkMode() {
  return {
    postcssPlugin: 'duplicate-from-media',
    Once(root) {
      root.walkAtRules('media', atRule => {
        if (atRule.params !== '(prefers-color-scheme: dark)') return;
        atRule.walkRules(rule => {
          const cloned = rule.clone();
          rule.selector += ':not(.theme-light)';
          cloned.selector += '.theme-dark';
          atRule.parent.insertBefore(atRule, cloned);
        });
      });
    }
  };
}
duplicateDarkMode.postcss = true;
