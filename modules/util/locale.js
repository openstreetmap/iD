var translations = Object.create(null);

export var currentLocale = 'en';
export var textDirection = 'ltr';

export function setLocale(_) {
    if (translations[_] !== undefined) {
        currentLocale = _;
    } else if (translations[_.split('-')[0]]) {
        currentLocale = _.split('-')[0];
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
        .map(function (s) { return s.replace('<TX_DOT>', '.'); })
        .reverse();

    var rep = translations[loc];

    while (rep !== undefined && path.length) {
        rep = rep[path.pop()];
    }

    if (rep !== undefined) {
        if (o) {
            for (var k in o) {
                rep = rep.replace('{' + k + '}', o[k]);
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
