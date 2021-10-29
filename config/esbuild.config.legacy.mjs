import esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';

esbuild
  .build({
    bundle: true,
    sourcemap: true,
    entryPoints: ['./modules/id.legacy.js'],
    legalComments: 'none',
    logLevel: 'info',
    outfile: 'dist/iD.legacy.js',
    target: 'es5',
    plugins: [babel()]
  })
  .catch(() => process.exit(1));