import esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';

esbuild
  .build({
    minify: true,
    bundle: true,
    sourcemap: true,
    entryPoints: ['./modules/id.legacy.js'],
    legalComments: 'none',
    logLevel: 'info',
    outfile: 'dist/iD.legacy.min.js',
    target: 'es5',
    plugins: [babel()]
  })
  .catch(() => process.exit(1));