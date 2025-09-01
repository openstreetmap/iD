import http from 'node:http';
import chalk from 'chalk';
import gaze from 'gaze';
import serve from 'serve-handler';
import { buildCSS } from './build_css.js';

const port = 8080;

gaze(['css/**/*.css'], (err, watcher) => {
  watcher.on('all', () => buildCSS());
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
  console.log(chalk.yellow(`Listening on ${port}`));
});
