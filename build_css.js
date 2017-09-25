var glob = require('glob');
var concat = require('concat-files');
var colors = require('colors/safe');

module.exports = function buildCSS(isDevelopment) {
    var building = false;
    return function () {
        if (building) return;
        console.log('building css');
        console.time(colors.green('css built'));
        building = true;
        glob('css/**/*.css', function (er, files) {
            if (er) console.error(er);   
            concat(files, 'dist/iD.css', function (err) {
                if (err) console.error(err);
                console.timeEnd(colors.green('css built'));
                building = false;                
            });
        }); 
    };
};

