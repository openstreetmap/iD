import http from 'node:http';
import { glob } from 'node:fs/promises';
import { styleText } from 'node:util';
import { watch } from 'chokidar';
import serve from 'serve-handler';
import { buildCSS } from './build_css.js';

const port = 8080;

watch(
  await Array.fromAsync(glob('css/**/*.css')), {
  ignoreInitial: false
}).on('all', () => {
  buildCSS();
});

const server = http.createServer((request, response) => {
  return serve(request, response, {
    cleanUrls: false,
    rewrites: [{
      source: '/',
      destination: '/index.html'
    }],
    symlinks: true,
    headers: [{
      source: '**',
      headers: [{
        key : 'Cache-Control',
        value : 'no-cache'
      }]
    }]
  });
});

server.listen(port, () => {
  /* eslint-disable no-console */
  console.log(styleText('yellow', `Listening on ${port}`));
});
