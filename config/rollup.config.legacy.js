/* eslint-disable no-console */
import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import progress from 'rollup-plugin-progress';
import nodeResolve from '@rollup/plugin-node-resolve';


// The "legacy" build includes all modules in a single bundle:
// * Runs `buble` to transpile ES6 -> ES5 (needed for IE11 and PhantomJS)
// * No sourcemaps

export default {
  input: './modules/id.js',
  onwarn: onWarn,
  output: {
    file: 'dist/iD.legacy.js',
    format: 'iife',
    sourcemap: false,
    strict: false
  },
  plugins: [
    progress(),
    includePaths({
      paths: ['node_modules/d3/node_modules']   // npm2 or windows
    }),
    nodeResolve({ dedupe: ['object-inspect'] }),
    commonjs(),
    json({ indent: '' }),
    buble()
  ]
};

function onWarn(warning, warn) {
  // skip certain warnings
  if (warning.code === 'CIRCULAR_DEPENDENCY') return;
  if (warning.code === 'EVAL') return;

  // Use default for everything else
  console.log(warning.code);
  warn(warning);
}
