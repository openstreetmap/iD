/* eslint-disable no-console */
import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import progress from 'rollup-plugin-progress';


// The "dev" build includes all modules in a single bundle - for now
// * Skips transpilation (so it includes ES6 code and must run in a modern browser)
// * Also generates sourcemaps

export default {
  input: './modules/id.js',
  onwarn: onWarn,
  output: {
    file: 'dist/iD.js',
    format: 'iife',
    sourcemap: true,
    strict: false
  },
  plugins: [
    progress(),
    includePaths({
      paths: ['node_modules/d3/node_modules']  // npm2 or windows
    }),
    nodeResolve({ dedupe: ['object-inspect'] }),
    commonjs(),
    json({ indent: '' })
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
