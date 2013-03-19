var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    YAML = require('js-yaml'),
    _ = require('./js/lib/lodash');

function read(f) {
    return JSON.parse(fs.readFileSync(f));
}

function r(f) {
    return read(__dirname + '/data/' + f);
}

function rp(f) {
    return r('presets/' + f);
}

var translations = {
    fields: {},
    presets: {}
};

var fields = {};
glob.sync(__dirname + '/data/presets/fields/*.json').forEach(function(file) {
    var field = read(file),
        id = path.basename(file, '.json');
    translations.fields[id] = {label: field.label};
    if (field.strings) {
        for (var i in field.strings) {
            translations.fields[id][i] = field.strings[i];
        }
    }
    fields[id] = field;
});
fs.writeFileSync('data/presets/fields.json', JSON.stringify(fields, null, 4));

var presets = {};
glob.sync(__dirname + '/data/presets/presets/**/*.json').forEach(function(file) {
    var preset = read(file),
        id = file.match(/presets\/presets\/([^.]*)\.json/)[1];
    translations.presets[id] = {
        name: preset.name,
        terms: (preset.terms || []).join(',')
    };
    presets[id] = preset;
});
fs.writeFileSync('data/presets/presets.json', JSON.stringify(presets, null, 4));

fs.writeFileSync('data/presets.yaml', YAML.dump({en: {presets: translations}}));

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

// Push changes from data/core.yaml into data/locales.js
var core = YAML.load(fs.readFileSync('data/core.yaml', 'utf8'));
var presets = YAML.load(fs.readFileSync('data/presets.yaml', 'utf8'));
var en = _.merge(core, presets);
var out = 'locale.en = ' + JSON.stringify(en.en, null, 4) + ';\n';
fs.writeFileSync('data/locales.js', fs.readFileSync('data/locales.js', 'utf8').replace(/locale.en =[^;]*;/, out));
