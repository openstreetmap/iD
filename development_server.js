/* eslint-disable no-console */

var http = require('http');
var gaze = require('gaze');
var ecstatic = require('ecstatic');
var colors = require('colors/safe');

var isDevelopment = process.argv[2] === 'develop';

var buildData = require('./build_data')(isDevelopment);
var buildSrc = require('./build_src')(isDevelopment);
var buildCSS = require('./build_css')(isDevelopment);

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

    gaze(
        [
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
