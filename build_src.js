/* eslint-disable no-console */
const colors = require('colors/safe');
const commonjs = require('rollup-plugin-commonjs');
const includePaths = require('rollup-plugin-includepaths');
const json = require('rollup-plugin-json');
const nodeResolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup');
const shell = require('shelljs');
const visualizer = require('rollup-plugin-visualizer');

let _currBuild = null;

// rollup plugin options
const INCLUDEPATHSOPTS = {
  paths: ['node_modules/d3/node_modules'],  // npm2 or windows
  include: {
    'martinez-polygon-clipping': 'node_modules/martinez-polygon-clipping/dist/martinez.umd.js'
  }
};
const NODERESOLVEOPTS = {
  mainFields: ['module', 'main'],
  browser: false,
  dedupe: ['object-inspect']
};
const JSONOPTS = {
  indent: ''
};



// if called directly, do the thing.
buildSrc();


function buildSrc() {
  if (_currBuild) return _currBuild;

  const START = '🏗   ' + colors.yellow('Building bundles...');
  const END = '👍  ' + colors.green('bundles built');

  console.log('');
  console.log(START);
  console.time(END);

  return _currBuild =
    buildModern()
    // .then(() => buildES5())
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
};


function buildModern() {
  console.log('📦   ' + colors.yellow('Bundling modern JavaScript...'));

  // Start clean
  shell.rm('-f', [
    'dist/iD.js',
    'dist/iD.js.map'
  ]);

  let prom =
    rollup.rollup({
      input: './modules/id.js',
      onwarn: onWarn,
      plugins: [
        includePaths(INCLUDEPATHSOPTS),
        nodeResolve(NODERESOLVEOPTS),
        commonjs(),
        json(JSONOPTS)
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
};


function buildES5() {
  console.log('📦   ' + colors.yellow('Bundling ES5 JavaScript...'));

  // Start clean
  shell.rm('-f', [
    'dist/iD.es5.js',
    'dist/iD.es5.js.map'
  ]);

  let prom =
    rollup.rollup({
      input: './modules/id.js',
      plugins: [
        includePaths(INCLUDEPATHSOPTS),
        nodeResolve(NODERESOLVEOPTS),
        commonjs(),
        json(JSONOPTS)
      ]
    })
    .then((bundle) => {
      return bundle.write({
        format: 'iife',
        file: 'dist/iD.es5.js',
        sourcemap: true,
        strict: false
      });
    });

  return prom;
};


function buildStats() {
  console.log('📦   ' + colors.yellow('Building statistics...'));

  // Start clean
  shell.rm('-f', [
    'docs/statistics.html'
  ]);

  return
    rollup.rollup({
      input: './modules/id.js',
      plugins: [
        includePaths(INCLUDEPATHSOPTS),
        nodeResolve(NODERESOLVEOPTS),
        commonjs(),
        json(JSONOPTS),
        visualizer({
          filename: 'docs/statistics.html',
          sourcemap: true
        })
      ]
    });
};

function onWarn(warning, warn) {
  // skip certain warnings
  if (warning.code === 'CIRCULAR_DEPENDENCY') return;
  if (warning.code === 'EVAL') return;

  // Use default for everything else
  console.log(colors.yellow(warning.code));
  warn(warning);
}


module.exports = buildSrc;
