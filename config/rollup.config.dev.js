import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import replace from 'rollup-plugin-replace';

import mapValues from 'lodash/mapValues';
import onwarn from './onwarn';

import * as config from './config';

// The "dev" build includes all modules in a single bundle - for now
// * Skips transpilation (so it includes ES6 code and must run in a modern browser)
// * Also generates sourcemaps

export default {
  input: './modules/id.js',
  output: {
    file: 'dist/iD.js',
    sourcemap: true,
    format: 'iife',
    strict: false
  },
  onwarn,
  plugins: [
    replace({
      include: ['modules/config.js'],
      exclude: ['node_modules/**'],
      values: mapValues(config, value => JSON.stringify(value))
    }),
    progress(),
    includePaths({
      paths: ['node_modules/d3/node_modules']  // npm2 or windows
    }),
    nodeResolve({ dedupe: ['object-inspect'] }),
    commonjs(),
    json({ indent: '' })
  ]
};
