import esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';

esbuild
  .build({
    minify: true,
    bundle: true,
    sourcemap: true,
    entryPoints: ['./modules/id.js'],
    legalComments: 'none',
    logLevel: 'info',
    outfile: 'dist/iD.legacy.min.js',
    target: 'es5',
    plugins: [babel({
      filter: /.*/,
      namespace: '',
      babelHelpers: 'bundled',
      // avoid circular dependencies due to `useBuiltIns: usage` option
      exclude: [/\/core-js\//],
      sourceType: 'unambiguous',
    })],
  })
  .catch(() => process.exit(1));

