/* eslint-disable no-console */
const colors = require('colors/safe');
const ecstatic = require('ecstatic');
const gaze = require('gaze');
const http = require('http');

const isDevelopment = process.argv[2] === 'develop';

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
            '!data/presets.yaml',
            '!data/taginfo.json',
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

    http.createServer(
        ecstatic({ root: __dirname, cache: 0 })
    ).listen(8080);

    console.log(colors.yellow('Listening on :8080'));
}
