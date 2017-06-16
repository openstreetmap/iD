/* Downloads the latest translations from Transifex */

var request = require('request').defaults({ maxSockets: 1 }),
    yaml = require('js-yaml'),
    fs = require('fs'),
    stringify = require('json-stable-stringify'),
    _ = require('lodash');

var resources = ['core', 'presets', 'imagery'];
var outdir = './dist/locales/';
var api = 'https://www.transifex.com/api/2/';
var projectURL = api + 'project/id-editor/';


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
    sourcePresets = yaml.load(fs.readFileSync('./data/presets.yaml', 'utf8')),
    sourceImagery = yaml.load(fs.readFileSync('./node_modules/editor-layer-index/i18n/en.yaml', 'utf8'));


asyncMap(resources, getResource, function(err, locales) {
    if (err) return console.log(err);

    var locale = _.merge(sourceCore, sourcePresets, sourceImagery),
        dataLocales = {};

    locales.forEach(function(l) {
        locale = _.merge(locale, l);
    });

    asyncMap(Object.keys(locale),
        function(code, done) {
            if (code === 'en' || _.isEmpty(locale[code])) {
                done();
            } else {
                var obj = {};
                obj[code] = locale[code];
                fs.writeFileSync(outdir + code + '.json', JSON.stringify(obj, null, 4));
                getLanguageInfo(code, function(err, info) {
                    dataLocales[code] = { rtl: info && info.rtl };
                    done();
                });
            }
        }, function(err) {
            if (!err) {
                fs.writeFileSync('data/locales.json', stringify({ dataLocales: dataLocales }, { space: 4 }));
            }
        }
    );
});


function getResource(resource, callback) {
    var resourceURL = projectURL + 'resource/' + resource + '/';
    getLanguages(resourceURL, function(err, codes) {
        if (err) return callback(err);

        asyncMap(codes, getLanguage(resourceURL), function(err, results) {
            if (err) return callback(err);

            var locale = {};
            results.forEach(function(result, i) {
                locale[codes[i]] = result;
            });

            callback(null, locale);
        });
    });
}


function getLanguage(resourceURL) {
    return function(code, callback) {
        code = code.replace(/-/g, '_');
        var url = resourceURL + 'translation/' + code;
        if (code === 'vi') { url += '?mode=reviewed'; }

        request.get(url, { auth : auth }, function(err, resp, body) {
            if (err) return callback(err);
            console.log(resp.statusCode + ': ' + url);
            var content = JSON.parse(body).content;
            callback(null, yaml.safeLoad(content)[code]);
        });
    };
}


function getLanguageInfo(code, callback) {
    code = code.replace(/-/g, '_');
    var url = api + 'language/' + code;
    request.get(url, { auth : auth }, function(err, resp, body) {
        if (err) return callback(err);
        console.log(resp.statusCode + ': ' + url);
        callback(null, JSON.parse(body));
    });
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
    setTimeout(function() {
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
    }, 300);
}
