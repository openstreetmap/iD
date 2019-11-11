/* eslint-disable no-console */
const buble = require('@rollup/plugin-buble');
const colors = require('colors/safe');
const commonjs = require('rollup-plugin-commonjs');
const includePaths = require('rollup-plugin-includepaths');
const json = require('rollup-plugin-json');
const nodeResolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup');
const shell = require('shelljs');
// const visualizer = require('rollup-plugin-visualizer');

let _currBuild = null;


function buildSrc() {
  if (_currBuild) return _currBuild;

  const START = '🏗   ' + colors.yellow('Building source...');
  const END = '👍  ' + colors.green('source built');

  console.log('');
  console.log(START);
  console.time(END);

  return _currBuild =
    Promise.resolve()
    .then(() => buildBundle())
    .then(() => {
      console.timeEnd(END);
      console.log('');
      _currBuild = null;
    })
    .catch((err) => {
      console.error(err);
      console.log('');
      _currBuild = null;
      process.exit(1);
    });
}


function buildBundle() {
  console.log('📦    ' + colors.yellow('Bundling JavaScript...'));

  // Start clean
  shell.rm('-f', [
    'dist/iD.js',
    'dist/iD.js.map',
    // 'docs/statistics.html'
  ]);

  let prom =
    rollup.rollup({
      input: './modules/id.js',
      onwarn: onWarn,
      plugins: [
        includePaths({
          paths: ['node_modules/d3/node_modules'],  // npm2 or windows
          include: {
            'martinez-polygon-clipping': 'node_modules/martinez-polygon-clipping/dist/martinez.umd.js'
          }
        }),
        nodeResolve({
          mainFields: ['module', 'main'],
          browser: false,
          dedupe: ['object-inspect']
        }),
        commonjs(),
        json({ indent: '' }),
        buble(),
        // viz causes src build to take about 3x longer; skip
        // visualizer({
        //   filename: 'docs/statistics.html',
        //   sourcemap: true
        // })
      ]
    })
    .then((bundle) => {
      return bundle.write({
        format: 'iife',
        file: 'dist/iD.js',
        sourcemap: true,
        strict: false
      });
    });

  return prom;
}


function onWarn(warning, warn) {
  // skip certain warnings
  if (warning.code === 'CIRCULAR_DEPENDENCY') return;
  if (warning.code === 'EVAL') return;

  // Use default for everything else
  console.log(colors.yellow(warning.code));
  warn(warning);
}


module.exports = buildSrc;
