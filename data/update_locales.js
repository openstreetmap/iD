/* Downloads the latest translations from Transifex */

const requireESM = require('esm')(module);
const _isEmpty = requireESM('lodash-es/isEmpty').default;
const _merge = requireESM('lodash-es/merge').default;

const fs = require('fs');
const prettyStringify = require('json-stringify-pretty-compact');
const request = require('request').defaults({ maxSockets: 1 });
const YAML = require('js-yaml');

const resources = ['core', 'presets', 'imagery', 'community'];
const outdir = './dist/locales/';
const api = 'https://www.transifex.com/api/2/';
const projectURL = api + 'project/id-editor/';


/*
 * Transifex oddly doesn't allow anonymous downloading
 *
 * auth is stored in transifex.auth in a json object:
 *  {
 *      "user": "username",
 *      "pass": "password"
 *  }
 *  */

const auth = JSON.parse(fs.readFileSync('./transifex.auth', 'utf8'));

const sourceCore = YAML.load(fs.readFileSync('./data/core.yaml', 'utf8'));
const sourcePresets = YAML.load(fs.readFileSync('./data/presets.yaml', 'utf8'));
const sourceImagery = YAML.load(fs.readFileSync('./node_modules/editor-layer-index/i18n/en.yaml', 'utf8'));
const sourceCommunity = YAML.load(fs.readFileSync('./node_modules/osm-community-index/i18n/en.yaml', 'utf8'));


asyncMap(resources, getResource, function(err, results) {
    if (err) return console.log(err);

    var locale = _merge(
        sourceCore,
        sourcePresets,
        sourceImagery,
        { en: { community: sourceCommunity.en } }  // add namespace
    );
    var dataLocales = {};

    results.forEach(function(l) {
        locale = _merge(locale, l);
    });

    asyncMap(Object.keys(locale),
        function(code, done) {
            if (code === 'en' || _isEmpty(locale[code])) {
                done();
            } else {
                var obj = {};
                obj[code] = locale[code];
                fs.writeFileSync(outdir + code + '.json', JSON.stringify(obj, null, 4));

                getLanguageInfo(code, function(err, info) {
                    var rtl = info && info.rtl;
                    // exceptions: see #4783
                    if (code === 'ckb') {
                        rtl = true;
                    } else if (code === 'ku') {
                        rtl = false;
                    }
                    dataLocales[code] = { rtl: rtl };
                    done();
                });
            }
        }, function(err) {
            if (!err) {
                const keys = Object.keys(dataLocales).sort();
                var sorted = {};
                keys.forEach(function (k) { sorted[k] = dataLocales[k]; });
                fs.writeFileSync('data/locales.json', prettyStringify({ dataLocales: sorted }));
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
                if (resource === 'community' && Object.keys(result).length) {
                    locale[codes[i]] = { community: result };  // add namespace

                } else {
                    if (resource === 'presets') {
                        // remove terms that were not really translated
                        var presets = (result.presets && result.presets.presets) || {};
                        for (const key of Object.keys(presets)) {
                            var preset = presets[key];
                            if (!preset.terms) continue;
                            preset.terms = preset.terms.replace(/<.*>/, '').trim();
                            if (!preset.terms) {
                                delete preset.terms;
                                if (_isEmpty(preset)) {
                                    delete presets[key];
                                }
                            }
                        }
                    }

                    locale[codes[i]] = result;
                }
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
            callback(null, YAML.safeLoad(content)[code]);
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
    var index = 0;
    var remaining = inputs.length;
    var results = [];
    var error;

    next();

    function next() {
        callFunc(index++);
        if (index < inputs.length) {
            setTimeout(next, 200);
        }
    }

    function callFunc(i) {
        var d = inputs[i];
        func(d, function done(err, data) {
            if (err) error = err;
            results[i] = data;
            remaining--;
            if (!remaining) callback(error, results);
        });
    }
}
