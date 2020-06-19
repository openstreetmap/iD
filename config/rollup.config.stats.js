import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import replace from 'rollup-plugin-replace';
import visualizer from 'rollup-plugin-visualizer';

import mapValues from 'lodash/mapValues';
import onwarn from './onwarn';

import * as config from './config';

// The "stats" build is just like the "dev" build,
// but it includes the visualizer plugin to generate a statistics page (slow)

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
    json({ indent: '' }),
    visualizer({
      filename: 'docs/statistics.html',
      sourcemap: true
    })
  ]
};
