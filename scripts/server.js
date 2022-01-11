/* eslint-disable no-console */
const chalk = require('chalk');
const gaze = require('gaze');
const StaticServer = require('static-server');

const buildCSS = require('./build_css.js');


gaze(['css/**/*.css'], (err, watcher) => {
  watcher.on('all', () => buildCSS());
});

const server = new StaticServer({ rootPath: process.cwd(), port: 8080, followSymlink: true });
server.start(() => {
  console.log(chalk.yellow(`Listening on ${server.port}`));
});
