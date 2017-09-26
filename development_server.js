/* eslint-disable no-console */

var fs = require('fs');
var rollup = require('rollup');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var json = require('rollup-plugin-json');
var http = require('http');
var gaze = require('gaze');
var ecstatic = require('ecstatic');
var glob = require('glob');
var concat = require('concat-files');

function makeCSS() {
    glob('css/**/*.css', function (er, files) {
        if (er) console.error(er);   
        concat(files, 'dist/iD.css', function (err) {
            if (err) console.error(err);
            console.log('css built');
        });
    }); 
}

var building = false;
var cache;

var isDevelopment = process.argv[2] === 'develop';

if (isDevelopment) {
    build();
    makeCSS();

    gaze(['css/**/*.css'], function(err, watcher) {
        watcher.on('all', function() {
            makeCSS();
        });
    });

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
    makeCSS();
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
        input: './modules/id.js',
        plugins: [
            nodeResolve({
                module: true, main: true, browser: false
            }),
            commonjs(),
            json()
        ],
        cache: cache
    }).then(function (bundle) {
        bundle.write({
            format: 'iife',
            file: 'dist/iD.js',
            sourcemap: true,
            strict: false
        });
        building = false;
        cache = bundle;
        console.timeEnd('Rebuilt');
    }, function(err) {
        building = false;
        cache = undefined;
        console.error(err);
    });
}

