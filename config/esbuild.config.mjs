import esbuild from 'esbuild';
import fs from 'node:fs';
import parse from 'minimist';
import envs from './envs.mjs';
import browserslistToEsbuild from 'browserslist-to-esbuild';

let args = parse(process.argv.slice(2), {boolean: true});

const context = await esbuild.context({
  define: envs,
  bundle: true,
  sourcemap: true,
  entryPoints: ['./modules/id.js'],
  legalComments: 'none',
  logLevel: 'info',
  metafile: true,
  outfile: 'dist/iD.js',
  target: browserslistToEsbuild(),
});

if (args.watch) {
  await context.watch();
} else {
  const build = await context.rebuild();
  if (args.stats) {
    fs.writeFileSync('./dist/esbuild.json', JSON.stringify(build.metafile, null, 2));
  }
  await context.dispose();
}
