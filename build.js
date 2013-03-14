var fs = require('fs'),
    path = require('path'),
    glob = require('glob');

function read(f) {
    return JSON.parse(fs.readFileSync(f));
}

function r(f) {
    return read(__dirname + '/data/' + f);
}

function rp(f) {
    return r('presets/' + f);
}

var fields = {};
glob.sync(__dirname + '/data/presets/fields/*.json').forEach(function(file) {
    fields[path.basename(file, '.json')] = read(file);
});
fs.writeFileSync('data/presets/fields.json', JSON.stringify(fields, null, 4));

fs.writeFileSync('data/presets/presets.json', JSON.stringify(
    glob.sync(__dirname + '/data/presets/presets/**/*.json').map(function(file) {
        return read(file);
    }), null, 4));

fs.writeFileSync('data/data.js', 'iD.data = ' + JSON.stringify({
    deprecated: r('deprecated.json'),
    discarded: r('discarded.json'),
    keys: r('keys.json'),
    imagery: r('imagery.json'),
    presets: {
        presets: rp('presets.json'),
        defaults: rp('defaults.json'),
        categories: rp('categories.json'),
        fields: rp('fields.json')
    }
}, null, 4) + ';');
