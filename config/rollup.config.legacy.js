import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import replace from 'rollup-plugin-replace';
import buble from '@rollup/plugin-buble';

import mapValues from 'lodash/mapValues';
import onwarn from './onwarn';

import * as config from './config';

// The "legacy" build includes all modules in a single bundle:
// * Runs `buble` to transpile ES6 -> ES5 (needed for IE11 and PhantomJS)
// * No sourcemaps

export default {
  input: './modules/id.js',
  output: {
    file: 'dist/iD.legacy.js',
    sourcemap: false,
    format: 'iife',
    strict: false
  },
  onwarn,
  plugins: [
    replace({
      include: ['modules/config.js'],
      exclude: ['node_modules/**'],
      values: mapValues(value => JSON.stringify(value), config)
    }),
    progress(),
    includePaths({
      paths: ['node_modules/d3/node_modules']  // npm2 or windows
    }),
    nodeResolve({ dedupe: ['object-inspect'] }),
    commonjs(),
    json({ indent: '' }),
    buble()
  ]
};
