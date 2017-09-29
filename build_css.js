/* eslint-disable no-console */

const glob = require('glob');
const concat = require('concat-files');
const colors = require('colors/safe');


module.exports = function buildCSS() {
    var building = false;
    return function () {
        if (building) return;
        console.log('building css');
        console.time(colors.green('css built'));
        building = true;
        return concatFilesProm('css/**/*.css', 'dist/iD.css')
            .then(function () {
                console.timeEnd(colors.green('css built'));
                building = false;
            })
            .catch(function (err) {
                console.error(err);
                process.exit(1);
            });
    };
};

function concatFilesProm(globPath, output) {
    return new Promise(function (res, rej) {
        glob(globPath, function (er, files) {
            if (er) return rej(er);
            concat(files, output, function (err) {
                if (err) return rej(err);
                res();
            });
        });
    });
}
