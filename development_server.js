/* eslint-disable no-console */

var fs = require('fs');
var rollup = require('rollup');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var json = require('rollup-plugin-json');
var http = require('http');
var gaze = require('gaze');
var ecstatic = require('ecstatic');

var building = false;


if (process.argv[2] === 'develop') {
    build();

    gaze(['modules/**/*.js', 'data/**/*.{js,json}'], function(err, watcher) {
        watcher.on('all', function() {
            build();
        });
    });

    http.createServer(
        ecstatic({ root: __dirname, cache: 0 })
    ).listen(8080);

    console.log('Listening on :8080');

} else {
    build();
}



function unlink(f) {
    try { fs.unlinkSync(f); } catch (e) { /* noop */ }
}

function build() {
    if (building) return;

    // Start clean
    unlink('dist/iD.js');
    unlink('dist/iD.js.map');

    building = true;
    console.log('Rebuilding');
    console.time('Rebuilt');

    rollup.rollup({
        entry: './modules/id.js',
        plugins: [
            nodeResolve({
                jsnext: true, main: true, browser: false
            }),
            commonjs(),
            json()
        ]

    }).then(function (bundle) {
        bundle.write({
            format: 'iife',
            dest: 'dist/iD.js',
            sourceMap: true,
            useStrict: false
        });
        building = false;
        console.timeEnd('Rebuilt');

    }, function(err) {
        building = false;
        console.error(err);
    });
}

