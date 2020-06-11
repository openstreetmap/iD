/* eslint-disable no-console */
import visualizer from 'rollup-plugin-visualizer';
import { input, plugins, onwarn, output } from './rollup.config.common';

// The "stats" build is just like the "dev" build,
// but it includes the visualizer plugin to generate a statistics page (slow)

export default {
  input,
  onwarn,
  output: Object.assign({}, {
    file: 'dist/iD.js',
    sourcemap: true
  }, output),
  plugins: plugins.concat([
    visualizer({
      filename: 'docs/statistics.html',
      sourcemap: true
    })
  ])
};
