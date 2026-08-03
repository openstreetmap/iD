import path from 'node:path';
import { fileURLToPath } from 'node:url';
import browserslist from 'browserslist';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { browserslistToTargets } from 'lightningcss';
import { defineConfig } from 'vitest/config';
import { visualizer } from 'rollup-plugin-visualizer';
import { idCssPlugin } from './scripts/build_css.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Single source of truth: package.json "browserslist"
const cssTargets = browserslistToTargets(browserslist());
const jsTargets = browserslistToEsbuild();

export default defineConfig(({ mode }) => ({
  base: './',
  envPrefix: 'ID_',
  server: {
    port: 8080,
  },
  resolve: {
    alias: {
      '/dist': path.resolve(__dirname, 'dist'),
    },
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: cssTargets,
    },
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: false,
    target: jsTargets,
    rollupOptions: {
      input: {
        // Library bundle used by embedders: exposes `window.iD` + emits iD.css.
        'iD.min': path.resolve(__dirname, 'lib.ts'),
        // Standalone page: Vite generates dist/index.html (+ index.js) from this.
        index: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
        assetFileNames: (asset) =>
          asset.name?.endsWith('.css') ? 'iD.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    idCssPlugin(),
    ...(mode === 'stats'
      ? [
          visualizer({
            filename: 'docs/statistics.html',
            gzipSize: true,
            template: 'treemap',
          }) as import('vite').PluginOption,
        ]
      : []),
  ],
  test: {
    css: true,
    environment: 'jsdom',
    globals: true,
    include: ['test/spec/**/*.{js,ts}'],
    setupFiles: ['./test/spec_helpers.ts'],
    execArgv: [
      '--no-experimental-webstorage',
    ],
  },
}));
