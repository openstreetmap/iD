/* eslint-disable no-console */
const colors = require('colors/safe');
const commonjs = require('rollup-plugin-commonjs');
const includePaths = require('rollup-plugin-includepaths');
const json = require('rollup-plugin-json');
const nodeResolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup');
const shell = require('shelljs');
//const visualizer = require('rollup-plugin-visualizer');

let _currBuild = null;

// if called directly, do the thing.
buildSrc();


function buildSrc() {
  if (_currBuild) return _currBuild;

  const START = '🏗   ' + colors.yellow('Building bundles...');
  const END = '👍  ' + colors.green('bundles built');

  console.log('');
  console.log(START);
  console.time(END);

  // Start clean
  shell.rm('-f', [
    //'docs/statistics.html',
    'dist/iD.js',
    'dist/iD.js.map'
  ]);

  return _currBuild =
    rollup.rollup({
      input: './modules/id.js',
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
    })
    .then(() => {
      console.timeEnd(END);
      console.log('');
      _currBuild = false;
    })
    .catch((err) => {
      console.error(err);
      _currBuild = false;
      console.log('');
      process.exit(1);
    });
};


module.exports = buildSrc;
