/* eslint-disable no-console */
import commonjs from '@rollup/plugin-commonjs';
import includePaths from 'rollup-plugin-includepaths';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import visualizer from 'rollup-plugin-visualizer';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';


// The "stats" build is just like the "dev" build,
// but it includes the visualizer plugin to generate a statistics page (slow)

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
    replace({
      // The react sources include a reference to process.env.NODE_ENV so we need to replace it here with the actual value
      // See: https://github.com/rollup/rollup/issues/208
      include: [ 'node_modules/(react|react-dom|prop-types|scheduler)/**' ],
      'process.env.NODE_ENV': '"development"',
    }),
    typescript({
      include: [ 'modules/**/*.+(jsx|ts|tsx)' ]
    }),
    commonjs(),
    json({ indent: '' }),
    visualizer({
      filename: 'docs/statistics.html',
      sourcemap: true
    })
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
