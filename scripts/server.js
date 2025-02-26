const http = require('http');
const chalk = require('chalk');
const gaze = require('gaze');
const serve = require('serve-handler');

const buildCSS = require('./build_css.js');


gaze(['css/**/*.css'], (err, watcher) => {
  watcher.on('all', () => buildCSS());
});

const server = http.createServer((request, response) => {
  return serve(request, response, {
    symlinks: true
  });
});

server.listen(8080, () => {
  /* eslint-disable no-console */
  console.log(chalk.yellow(`Listening on ${server.port}`));
});
