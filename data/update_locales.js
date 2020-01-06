/* Downloads the latest translations from Transifex */
const fs = require('fs');
const prettyStringify = require('json-stringify-pretty-compact');
const request = require('request').defaults({ maxSockets: 1 });
const YAML = require('js-yaml');
const colors = require('colors/safe');

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

const dataShortcuts = JSON.parse(fs.readFileSync('./data/shortcuts.json', 'utf8')).dataShortcuts;

const cldrMainDir = './node_modules/cldr-localenames-full/main/';

var referencedScripts = [];

const languageInfo = {
    dataLanguages: getLangNamesInNativeLang()
};
fs.writeFileSync('data/languages.json', JSON.stringify(languageInfo, null, 4));

var shortcuts = [];
dataShortcuts.forEach(function(tab) {
    tab.columns.forEach(function(col) {
        col.rows.forEach(function(row) {
            if (!row.shortcuts) return;
            row.shortcuts.forEach(function(shortcut) {
                if (shortcut.includes('.')) {
                    var info = {
                        shortcut: shortcut
                    };
                    if (row.modifiers) {
                        info.modifier = row.modifiers.join('');
                    }
                    shortcuts.push(info);
                }
            });
        });
    });
});

asyncMap(resources, getResource, function(err, results) {
    if (err) return console.log(err);

    // merge in strings fetched from transifex
    var allStrings = {};
    results.forEach(function(resourceStrings) {
        Object.keys(resourceStrings).forEach(function(code) {
            if (!allStrings[code]) { allStrings[code] = {}; }
            var source = resourceStrings[code];
            var target = allStrings[code];
            Object.keys(source).forEach(function(k) { target[k] = source[k]; });
        });
    });

    // write files and fetch language info for each locale
    var dataLocales = {
        en: { rtl: false, languageNames: languageNamesInLanguageOf('en'), scriptNames: scriptNamesInLanguageOf('en') }
    };
    asyncMap(Object.keys(allStrings),
        function(code, done) {
            if (code === 'en' || !Object.keys(allStrings[code]).length) {
                done();
            } else {
                var obj = {};
                obj[code] = allStrings[code];
                fs.writeFileSync(outdir + code + '.json', JSON.stringify(obj, null, 4));

                getLanguageInfo(code, function(err, info) {
                    var rtl = info && info.rtl;
                    // exceptions: see #4783
                    if (code === 'ckb') {
                        rtl = true;
                    } else if (code === 'ku') {
                        rtl = false;
                    }
                    dataLocales[code] = {
                        rtl: rtl,
                        languageNames: languageNamesInLanguageOf(code) || {},
                        scriptNames: scriptNamesInLanguageOf(code) || {}
                    };
                    done();
                });
            }
        }, function(err) {
            if (!err) {
                const keys = Object.keys(dataLocales).sort();
                var sorted = {};
                keys.forEach(function (k) { sorted[k] = dataLocales[k]; });
                fs.writeFileSync('data/locales.json', prettyStringify({ dataLocales: sorted }, { maxLength: 99999 }));
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
                                if (!Object.keys(preset).length) {
                                    delete presets[key];
                                }
                            }
                        }
                    } else if (resource === 'fields') {
                        // remove terms that were not really translated
                        var fields = (result.presets && result.presets.fields) || {};
                        for (const key of Object.keys(fields)) {
                            var field = fields[key];
                            if (!field.terms) continue;
                            field.terms = field.terms.replace(/\[.*\]/, '').trim();
                            if (!field.terms) {
                                delete field.terms;
                                if (!Object.keys(preset).length) {
                                    delete fields[key];
                                }
                            }
                        }
                    } else if (resource === 'core') {
                        checkForDuplicateShortcuts(codes[i], result);
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
            callback(null, JSON.parse(body).available_languages
                .map(function(d) { return d.code.replace(/_/g, '-'); })
                .filter(function(d) { return d !== 'en'; })
            );
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

function checkForDuplicateShortcuts(code, coreStrings) {
    var usedShortcuts = {};

    shortcuts.forEach(function(shortcutInfo) {
        var shortcutPathString = shortcutInfo.shortcut;
        var modifier = shortcutInfo.modifier || '';

        var path = shortcutPathString
            .split('.')
            .map(function (s) { return s.replace(/<TX_DOT>/g, '.'); })
            .reverse();

        var rep = coreStrings;

        while (rep !== undefined && path.length) {
            rep = rep[path.pop()];
        }

        if (rep !== undefined) {
            var shortcut = modifier + rep;
            if (usedShortcuts[shortcut] && usedShortcuts[shortcut] !== shortcutPathString) {
                var message = code + ': duplicate shortcut "' + shortcut + '" for "' + usedShortcuts[shortcut] + '" and "' + shortcutPathString + '"';
                console.warn(colors.yellow(message));
            } else {
                usedShortcuts[shortcut] = shortcutPathString;
            }
        }
    });
}

function getLangNamesInNativeLang() {
    // manually add languages we want that aren't in CLDR
    var unordered = {
        'oc': {
            nativeName: 'Occitan'
        },
        'ja-Hira': {
            base: 'ja',
            script: 'Hira'
        },
        'ja-Latn': {
            base: 'ja',
            script: 'Latn'
        },
        'ko-Latn': {
            base: 'ko',
            script: 'Latn'
        },
        'zh_pinyin': {
            base: 'zh',
            script: 'Latn'
        }
    };
    var langDirectoryPaths = fs.readdirSync(cldrMainDir);
    langDirectoryPaths.forEach(function(code) {

        var languagesPath = cldrMainDir + code + '/languages.json';

        //if (!fs.existsSync(languagesPath)) return;
        var languageObj = JSON.parse(fs.readFileSync(languagesPath, 'utf8')).main[code];

        var identity = languageObj.identity;

        // skip locale-specific languages
        if (identity.variant || identity.territory) return;

        var info = {};

        var script = identity.script;
        if (script) {
            referencedScripts.push(script);

            info.base = identity.language;
            info.script = script;
        }

        var nativeName = languageObj.localeDisplayNames.languages[code];
        if (nativeName) {
            info.nativeName = nativeName;
        }

        unordered[code] = info;
    });
    var ordered = {};
    Object.keys(unordered).sort().forEach(function(key) {
        ordered[key] = unordered[key];
    });
    return ordered;
}

var rematchCodes = { 'ar-AA': 'ar', 'zh-CN': 'zh', 'zh-HK': 'zh-Hant-HK', 'zh-TW': 'zh-Hant', 'pt-BR': 'pt', 'pt': 'pt-PT' };

function languageNamesInLanguageOf(code) {

    if (rematchCodes[code]) code = rematchCodes[code];

    var languageFilePath = cldrMainDir + code + '/languages.json';
    if (!fs.existsSync(languageFilePath)) {
        return null;
    }
    var translatedLangsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.languages;

    // ignore codes for non-languages
    for (var nonLangCode in { mis: true, mul: true, und: true, zxx: true }) {
        delete translatedLangsByCode[nonLangCode];
    }

    for (var langCode in translatedLangsByCode) {
        var altLongIndex = langCode.indexOf('-alt-long');
        if (altLongIndex !== -1) {
            // prefer long names (e.g. Chinese -> Mandarin Chinese)
            var base = langCode.substring(0, altLongIndex);
            translatedLangsByCode[base] = translatedLangsByCode[langCode];
        }

        if (langCode.includes('-alt-')) {
            // remove alternative names
            delete translatedLangsByCode[langCode];
        } else if (langCode === translatedLangsByCode[langCode]) {
            // no localized value available
            delete translatedLangsByCode[langCode];
        }
    }

    return translatedLangsByCode;
}

function scriptNamesInLanguageOf(code) {
    if (rematchCodes[code]) code = rematchCodes[code];

    var languageFilePath = cldrMainDir + code + '/scripts.json';
    if (!fs.existsSync(languageFilePath)) {
        return null;
    }
    var allTranslatedScriptsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.scripts;

    var translatedScripts = {};
    referencedScripts.forEach(function(script) {
        if (!allTranslatedScriptsByCode[script] || script === allTranslatedScriptsByCode[script]) return;

        translatedScripts[script] = allTranslatedScriptsByCode[script];
    });

    return translatedScripts;
}
