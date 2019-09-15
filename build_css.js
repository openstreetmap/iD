/* eslint-disable no-console */
const colors = require('colors/safe');
const concat = require('concat-files');
const glob = require('glob');
const fs = require('fs');
const postcss = require('postcss');
const prepend = require('postcss-selector-prepend');


module.exports = function buildCSS() {
    var isBuilding = false;
    return function () {
        if (isBuilding) return;

        console.log('building css');
        console.time(colors.green('css built'));
        isBuilding = true;

        return concatFilesProm('css/**/*.css', 'dist/iD.css')
            .then(function () {
                const css = fs.readFileSync('dist/iD.css', 'utf8');
                return postcss([prepend({ selector: '.id-container ' })]).process(css);
            })
            .then(function (result) {
                fs.writeFileSync('dist/iD.css', result.css);
                console.timeEnd(colors.green('css built'));
                isBuilding = false;
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
