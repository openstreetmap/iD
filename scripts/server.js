const http = require('http');
const chalk = require('chalk');
const gaze = require('gaze');
const serve = require('serve-handler');

const buildCSS = require('./build_css.js');
const port = 8080;

gaze(['css/**/*.css'], (err, watcher) => {
  watcher.on('all', () => buildCSS());
});

const server = http.createServer((request, response) => {
  return serve(request, response, {
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
