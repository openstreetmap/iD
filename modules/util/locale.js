import { dataLanguages } from '../../../data';

var translations = Object.create(null);

export var currentLocale = 'en';
export var textDirection = 'ltr';
export var languageNames = {};
export var scriptNames = {};

export function setLocale(val) {
    if (translations[val] !== undefined) {
        currentLocale = val;
    } else if (translations[val.split('-')[0]]) {
        currentLocale = val.split('-')[0];
    }
}

export function addTranslation(id, value) {
    translations[id] = value;
}

/**
 * Given a string identifier, try to find that string in the current
 * language, and return it.  This function will be called recursively
 * with locale `en` if a string can not be found in the requested language.
 *
 * @param {string}   s   string identifier
 * @param {object?}  o   object of token replacements and default string
 * @param {string?}  loc locale to use
 * @returns {string?} locale string
 */
export function t(s, o, loc) {
    loc = loc || currentLocale;

    var path = s
        .split('.')
        .map(function (s) { return s.replace(/<TX_DOT>/g, '.'); })
        .reverse();

    var rep = translations[loc];

    while (rep !== undefined && path.length) {
        rep = rep[path.pop()];
    }

    if (rep !== undefined) {
        if (o) {
            for (var k in o) {
                var variable = '{' + k + '}';
                var re = new RegExp(variable, 'g'); // check globally for variables
                rep = rep.replace(re, o[k]);
            }
        }
        return rep;
    }

    if (loc !== 'en') {
        return t(s, o, 'en');
    }

    if (o && 'default' in o) {
        return o.default;
    }

    var missing = 'Missing ' + loc + ' translation: ' + s;
    if (typeof console !== 'undefined') console.error(missing); // eslint-disable-line

    return missing;
}

/**
 * Given string 'ltr' or 'rtl', save that setting
 *
 * @param {string} dir ltr or rtl
 */

export function setTextDirection(dir) {
    textDirection = dir;
}

export function setLanguageNames(obj) {
    languageNames = obj;
}

export function setScriptNames(obj) {
    scriptNames = obj;
}

export function languageName(code, options) {
    if (languageNames[code]) { // name in locale langauge

        // e.g. German
        return languageNames[code];
    }
    // sometimes we only want the local name
    if (options && options.localOnly) return null;

    var langInfo = dataLanguages[code];

    if (langInfo) {
        if (langInfo.nativeName) { // name in native language

            // e.g. Deutsch (de)
            return t('translate.language_and_code', { language: langInfo.nativeName, code: code });

        } else if (langInfo.base && langInfo.script) {

            var base = langInfo.base; // the code of the langauge this is based on

            if (languageNames[base]) { // base language name in locale langauge
                var scriptCode = langInfo.script;
                var script = scriptNames[scriptCode] || scriptCode;

                // e.g. Serbian (Cyrillic)
                return t('translate.language_and_code', { language: languageNames[base], code: script });

            } else if (dataLanguages[base] && dataLanguages[base].nativeName) {

                // e.g. српски (sr-Cyrl)
                return t('translate.language_and_code', { language: dataLanguages[base].nativeName, code: code });
            }
        }
    }
    return code; // if not found, use the code
}
