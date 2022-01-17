import esbuild from 'esbuild';
import fs from 'node:fs';
import parse from 'minimist';

let args = parse(process.argv.slice(2), {boolean: true});
delete args._;

esbuild
  .build(Object.assign({
    bundle: true,
    sourcemap: true,
    entryPoints: ['./modules/id.js'],
    legalComments: 'none',
    logLevel: 'info',
    metafile: true,
    outfile: 'dist/iD.js'
  }, args))
  .then(result => {
    fs.writeFileSync('./dist/esbuild.json', JSON.stringify(result.metafile, null, 2));
  })
  .catch(() => process.exit(1));
