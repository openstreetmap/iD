/* eslint-disable no-console */
import buble from '@rollup/plugin-buble';
import { input, plugins, onwarn, output } from './rollup.config.common';


// The "legacy" build includes all modules in a single bundle:
// * Runs `buble` to transpile ES6 -> ES5 (needed for IE11 and PhantomJS)
// * No sourcemaps

export default {
  input,
  onwarn,
  output: Object.assign({}, {
    file: 'dist/iD.legacy.js',
    sourcemap: false,
  }, output),
  plugins: plugins.concat([
    buble()
  ])
};
