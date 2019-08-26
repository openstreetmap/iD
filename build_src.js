/* eslint-disable no-console */
const colors = require('colors/safe');
const commonjs = require('rollup-plugin-commonjs');
const includePaths = require('rollup-plugin-includepaths');
const json = require('rollup-plugin-json');
const nodeResolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup');
const shell = require('shelljs');
//const visualizer = require('rollup-plugin-visualizer');


module.exports = function buildSrc() {
    var isBuilding = false;

    return function () {
        if (isBuilding) return;

        // Start clean
        shell.rm('-f', [
            //'docs/statistics.html',
            'dist/iD.js',
            'dist/iD.js.map'
        ]);

        console.log('building src');
        console.time(colors.green('src built'));

        isBuilding = true;

        return rollup
            .rollup({
                input: './modules/id.js',
                plugins: [
                    includePaths( {
                        paths: ['node_modules/d3/node_modules'],  // npm2 or windows
                        include: {
                            'martinez-polygon-clipping': 'node_modules/martinez-polygon-clipping/dist/martinez.umd.js'
                        }
                    }),
                    nodeResolve({
                        mainFields: ['module', 'main'],
                        browser: false
                    }),
                    commonjs(),
                    json({ indent: '' }),
                    // viz causes src build to take about 3x longer; skip
                    // visualizer({
                    //     filename: 'docs/statistics.html',
                    //     sourcemap: true
                    // })
                ]
            })
            .then(function (bundle) {
                return bundle.write({
                    format: 'iife',
                    file: 'dist/iD.js',
                    sourcemap: true,
                    strict: false
                });
            })
            .then(function () {
                isBuilding = false;
                console.timeEnd(colors.green('src built'));
            })
            .catch(function (err) {
                isBuilding = false;
                console.error(err);
                process.exit(1);
            });
    };
};
