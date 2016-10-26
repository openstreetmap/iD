/* Downloads the latest translations from Transifex */

var request = require('request').defaults({maxSockets: 1}),
    yaml = require('js-yaml'),
    fs = require('fs'),
    _ = require('lodash');

var resources = ['core', 'presets'];
var outdir = './dist/locales/';
var api = 'https://www.transifex.com/api/2/';
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

    var locale = _.merge(sourceCore, sourcePresets),
        codes = [];

    locales.forEach(function(l) {
        locale = _.merge(locale, l);
    });

    for (var i in locale) {
        if (i === 'en' || _.isEmpty(locale[i])) continue;
        codes.push(i);
        var obj = {};
        obj[i] = locale[i];
        fs.writeFileSync(outdir + i + '.json', JSON.stringify(obj, null, 4));
    }

    fs.writeFileSync('data/locales.json', JSON.stringify({ dataLocales: codes }, null, 4));
});

function getResource(resource, callback) {
    resource = project + 'resource/' + resource + '/';
    getLanguages(resource, function(err, codes) {
        if (err) return callback(err);

        asyncMap(codes, getLanguage(resource), function(err, results) {
            if (err) return callback(err);

            var locale = {};
            results.forEach(function(result, i) {
                locale[codes[i]] = result;
            });

            callback(null, locale);
        });
    });
}

function getLanguage(resource) {
    return function(code, callback) {
        code = code.replace(/-/g, '_');
        var url = resource + 'translation/' + code;
        if (code === 'vi') url += '?mode=reviewed';
        request.get(url, { auth : auth }, function(err, resp, body) {
            if (err) return callback(err);
            console.log(resp.statusCode + ': ' + url);
            callback(null, yaml.load(JSON.parse(body).content)[code]);
        });
    };
}

function getLanguages(resource, callback) {
    var url = resource + '?details';
    request.get(url, { auth: auth },
        function(err, resp, body) {
        if (err) return callback(err);
        console.log(resp.statusCode + ': ' + url);
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
