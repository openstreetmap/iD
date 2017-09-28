var fs = require('fs');
var rollup = require('rollup');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var json = require('rollup-plugin-json');
var colors = require('colors/safe');


module.exports = function buildSrc(isDevelopment) {
    var cache;
    var building = false;
    return function() {
        if (building) return;

        // Start clean
        unlink('dist/iD.js');
        unlink('dist/iD.js.map');

        console.log('building src');
        console.time(colors.green('src built'));

        building = true;
    
        return rollup
            .rollup({
                entry: './modules/id.js',
                plugins: [
                    nodeResolve({
                        jsnext: true,
                        main: true,
                        browser: false
                    }),
                    commonjs(),
                    json()
                ],
                cache: cache
            })
            .then(function(bundle) {
                cache = bundle;
                return bundle.write({
                    format: 'iife',
                    dest: 'dist/iD.js',
                    sourceMap: true,
                    useStrict: false
                });
            })
            .then(function() {
                building = false;
                console.timeEnd(colors.green('src built'));
            })
            .catch(function(err) {
                building = false;
                cache = undefined;
                console.error(err);
                process.exit(1);
            });
    };
};


function unlink(f) {
    try { fs.unlinkSync(f); } catch (e) { /* noop */ }
}
