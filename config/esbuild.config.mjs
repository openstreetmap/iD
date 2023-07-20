import esbuild from 'esbuild';
import fs from 'node:fs';
import parse from 'minimist';
import envs from './envs.mjs';

let args = parse(process.argv.slice(2), {boolean: true});
delete args._;

const context = await esbuild.context({
  define: envs,
  bundle: true,
  sourcemap: true,
  entryPoints: ['./modules/id.js'],
  legalComments: 'none',
  logLevel: 'info',
  metafile: true,
  outfile: 'dist/iD.js'
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
