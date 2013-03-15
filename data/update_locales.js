var request = require('request'),
    yaml = require('js-yaml'),
    fs = require('fs'),
    _ = require('../js/lib/lodash.js');

var resources = ['core', 'presets'];
var outfile = './data/locales.js';
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
    var out = '';
    var locale = _.merge(sourceCore, sourcePresets);
    locales.forEach(function(l) {
        locale = _.merge(locale, l);
    });

    for (var i in locale) {
        out += 'locale.' + i + ' = ' + JSON.stringify(locale[i], null, 4) + ';';
    }
    fs.writeFileSync(outfile, out);
});

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

    });
}

function getLanguage(resource) {
    return function(code, callback) {
        request.get(resource+ 'translation/' + code, { auth : auth }, function(err, resp, body) {
            if (err) return callback(err);
            callback(null, JSON.parse(body).content);
        });
    };
}


function getLanguages(resource, callback) {
    request.get(resource + '?details', { auth: auth }, function(err, resp, body) {
        if (err) return callback(err);
        callback(null, JSON.parse(body).available_languages.map(function(d) {
            return d.code;
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
