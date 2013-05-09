/* Downloads the latest translations from Transifex */

var request = require('request'),
    yaml = require('js-yaml'),
    fs = require('fs'),
    _ = require('../js/lib/lodash.js'),
    delve = require('delve');

var resources = ['core', 'presets'];
var outdir = './dist/locales/';
var api = 'http://www.transifex.com/api/2/';
var project = api + 'project/id-editor/';

/*
 * Transifex oddly doesn't allow anonymous downloading
 *
 * auth is stored in transifex.auth in a json object:
 *  {
 *      "user": "username",
 *      "pass": "password"
 *  }
 *  */

var auth = JSON.parse(fs.readFileSync('./transifex.auth', 'utf8'));

var sourceCore = yaml.load(fs.readFileSync('./data/core.yaml', 'utf8')),
    sourcePresets = yaml.load(fs.readFileSync('./data/presets.yaml', 'utf8'));

asyncMap(resources, getResource, function(err, locales) {
    if (err) return console.log(err);

    var locale = _.merge(sourceCore, sourcePresets);
    locales.forEach(function(l) {
        locale = _.merge(locale, l);
    });

    for (var i in locale) {
        if (i === 'en') continue;
        validateTranslations(i, locale[i]);
        fs.writeFileSync(outdir + i + '.json', JSON.stringify(locale[i], null, 4));
    }
});

function validateTranslations(locale, translations) {
    var preset = delve(translations, 'presets.presets.amenity/cafe.name'),
        intro = delve(translations, 'intro.points.search');

    if (preset && intro && intro.toLocaleLowerCase().indexOf(preset.toLocaleLowerCase()) < 0) {
        console.warn(locale + ': "Cafe" is translated as "' + preset + '", which was not found in "' + intro + '"');
        console.warn('Edit on Transifex: https://www.transifex.com/projects/p/id-editor/translate/#' + locale + '/core/?key=intro.points.search');
    }

    preset = delve(translations, 'presets.presets.leisure/playground.name');
    intro = delve(translations, 'intro.areas.search');

    if (preset && intro && intro.toLocaleLowerCase().indexOf(preset.toLocaleLowerCase()) < 0) {
        console.warn(locale + ': "Playground" is translated as "' + preset + '", which was not found in "' + intro + '"');
        console.warn('Edit on Transifex: https://www.transifex.com/projects/p/id-editor/translate/#' + locale + '/core/?key=intro.areas.search');
    }
}

function getResource(resource, callback) {
    resource = project + 'resource/' + resource + '/';
    getLanguages(resource, function(err, codes) {
        if (err) return callback(err);

        asyncMap(codes, getLanguage(resource), function(err, results) {
            if (err) return callback(err);

            var locale = {};
            results.forEach(function(result, i) {
                locale[codes[i]] = yaml.load(result)[codes[i]];
            });

            callback(null, locale);

        });

        fs.writeFileSync('data/locales.json', JSON.stringify(codes, null, 4));
    });
}

function getLanguage(resource) {
    return function(code, callback) {
        request.get(resource + 'translation/' + code, { auth : auth },
            function(err, resp, body) {
            if (err) return callback(err);
            callback(null, JSON.parse(body).content);
        });
    };
}

function getLanguages(resource, callback) {
    request.get(resource + '?details', { auth: auth },
        function(err, resp, body) {
        if (err) return callback(err);
        callback(null, JSON.parse(body).available_languages.map(function(d) {
            return d.code.replace(/_/g, '-');
        }).filter(function(d) {
            return d !== 'en';
        }));
    });
}

function asyncMap(inputs, func, callback) {
    var remaining = inputs.length,
        results = [],
        error;

    inputs.forEach(function(d, i) {
        func(d, function done(err, data) {
            if (err) error = err;
            results[i] = data;
            remaining --;
            if (!remaining) callback(error, results);
        });
    });
}
