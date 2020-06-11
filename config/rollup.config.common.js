/* eslint-disable no-console */
import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import replace from 'rollup-plugin-replace';

import * as config from './config';

export const input = './modules/id.js';

export const output = {
  format: 'iife',
  strict: false
};

const mapValues = (fn, obj) => Object.fromEntries(Object.entries(obj).map(([field, value], index) => [field, fn(value, field, index)]));

export const plugins = [
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
  json({ indent: '' })
];

export const onwarn = (warning, warn) => {
  // skip certain warnings
  if (warning.code === 'CIRCULAR_DEPENDENCY') return;
  if (warning.code === 'EVAL') return;

  // Use default for everything else
  console.log(warning.code);
  warn(warning);
};
