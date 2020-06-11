import { input, output, onwarn, plugins } from './rollup.config.common';

// The "dev" build includes all modules in a single bundle - for now
// * Skips transpilation (so it includes ES6 code and must run in a modern browser)
// * Also generates sourcemaps

export default {
  input,
  onwarn,
  output: Object.assign({}, {
    file: 'dist/iD.js',
    sourcemap: true
  }, output),
  plugins
};
