let _translations = Object.create(null);
let _dataLanguages = {};

export let currentLocale = 'en';
export let textDirection = 'ltr';
export let languageNames = {};
export let scriptNames = {};

export function setLocale(val) {
  if (_translations[val] !== undefined) {
    currentLocale = val;
  } else if (_translations[val.split('-')[0]]) {
    currentLocale = val.split('-')[0];
  }
}

export function addTranslation(id, value) {
  _translations[id] = value;
}

/**
 * Given a string identifier, try to find that string in the current
 * language, and return it.  This function will be called recursively
 * with locale `en` if a string can not be found in the requested language.
 *
 * @param {string}    s             string identifier
 * @param {object?}   replacements  token replacements and default string
 * @param {string?}   locale        locale to use (defaults to currentLocale)
 * @returns {string?} localized string
 */
export function t(s, replacements, locale) {
  locale = locale || currentLocale;

  let path = s
    .split('.')
    .map(s => s.replace(/<TX_DOT>/g, '.'))
    .reverse();

  let result = _translations[locale];

  while (result !== undefined && path.length) {
    result = result[path.pop()];
  }

  if (result !== undefined) {
    if (replacements) {
      for (let k in replacements) {
        const token = `{${k}}`;
        const regex = new RegExp(token, 'g');
        result = result.replace(regex, replacements[k]);
      }
    }
    return result;
  }

  if (locale !== 'en') {
    return t(s, replacements, 'en');  // fallback - recurse with 'en'
  }

  if (replacements && 'default' in replacements) {
    return replacements.default;      // fallback - replacements.default
  }

  const missing = `Missing ${locale} translation: ${s}`;
  if (typeof console !== 'undefined') console.error(missing);  // eslint-disable-line

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

export function languageName(context, code, options) {
  // Data access is async now, which makes this complicated.
  // If _dataLanguages haven't been loaded yet, try to load them.
  // Worst case, we fallback to the code until the file has been loaded.
  if (!Object.keys(_dataLanguages).length) {
    context.data().get('languages')
      .then(d => _dataLanguages = d)
      .catch(() => { /* ignore */ });
  }

  if (languageNames[code]) {  // name in locale langauge
    // e.g. "German"
    return languageNames[code];
  }

  // sometimes we only want the local name
  if (options && options.localOnly) return null;

  const langInfo = _dataLanguages[code];
  if (langInfo) {
    if (langInfo.nativeName) {  // name in native language
      // e.g. "Deutsch (de)"
      return t('translate.language_and_code', { language: langInfo.nativeName, code: code });

    } else if (langInfo.base && langInfo.script) {
      const base = langInfo.base;   // the code of the langauge this is based on

      if (languageNames[base]) {   // base language name in locale langauge
        const scriptCode = langInfo.script;
        const script = scriptNames[scriptCode] || scriptCode;
        // e.g. "Serbian (Cyrillic)"
        return t('translate.language_and_code', { language: languageNames[base], code: script });

      } else if (_dataLanguages[base] && _dataLanguages[base].nativeName) {
        // e.g. "српски (sr-Cyrl)"
        return t('translate.language_and_code', { language: _dataLanguages[base].nativeName, code: code });
      }
    }
  }
  return code;  // if not found, use the code
}
