/* eslint-disable no-console */
const colors = require('colors/safe');
const gaze = require('gaze');
const StaticServer = require('static-server');

const isDevelopment = process.argv[2] === 'develop';
const port          = process.argv[3] || 8080;

const buildData = require('./build_data')(isDevelopment);
const buildSrc = require('./build_src')(isDevelopment);
const buildCSS = require('./build_css')(isDevelopment);


buildData()
    .then(function () {
        return buildSrc();
    });

buildCSS();

if (isDevelopment) {
    gaze(['css/**/*.css'], function(err, watcher) {
        watcher.on('all', function() {
            buildCSS();
        });
    });

    gaze([
            'data/**/*.{js,json}',
            'data/core.yaml',
            // ignore the output files of `buildData`
            '!data/presets/categories.json',
            '!data/presets/fields.json',
            '!data/presets/presets.json',
            '!data/presets/groups.json',
            '!data/presets.yaml',
            '!data/taginfo.json',
            '!data/territory-languages.json',
            '!dist/locales/en.json'
        ],
        function(err, watcher) {
            watcher.on('all', function() {
                buildData()
                    .then(function () {
                        // need to recompute js files when data changes
                        buildSrc();
                    });
            });
        }
    );

    gaze(['modules/**/*.js'], function(err, watcher) {
        watcher.on('all', function() {
            buildSrc();
        });
    });

    const server = new StaticServer({ rootPath: __dirname, port: port, followSymlink: true });
    server.start(function () {
        console.log(colors.yellow('Listening on ' + server.port));
    });
}
