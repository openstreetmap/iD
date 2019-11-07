/* eslint-disable no-console */
const colors = require('colors/safe');
const gaze = require('gaze');
const StaticServer = require('static-server');

const buildAll = require('./build');
const buildData = require('./build_data');
const buildSrc = require('./build_src');
const buildCSS = require('./build_css');

const CSSFILES = ['css/**/*.css'];
const SRCFILES = ['modules/**/*.js'];
const DATAFILES = [
  'data/**/*.{js,json}',
  'data/core.yaml',
  // ignore the output files of `buildData`
  '!data/presets/categories.json',
  '!data/presets/fields.json',
  '!data/presets/presets.json',
  '!data/presets.yaml',
  '!data/taginfo.json',
  '!data/territory-languages.json',
  '!dist/locales/en.json'
];


buildAll()
  .then(() => startServer());


function startServer() {
  gaze(CSSFILES, (err, watcher) => {
    watcher.on('all', () => buildCSS());
  });

  gaze(DATAFILES, (err, watcher) => {
    watcher.on('all', () => {
      buildData()
        .then(() => buildSrc());
    });
  });

  gaze(SRCFILES, (err, watcher) => {
    watcher.on('all', () => buildSrc());
  });

  const server = new StaticServer({ rootPath: __dirname, port: 8080, followSymlink: true });
  server.start(() => {
    console.log(colors.yellow('Listening on ' + server.port));
  });
}
