/* eslint-disable no-console */
import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';

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
