import { fileFetcher } from './file_fetcher';
import { utilDetect } from '../util/detect';
import { utilStringQs } from '../util';
import { utilArrayUniq } from '../util/array';

let _mainLocalizer = coreLocalizer(); // singleton
let _t = _mainLocalizer.t;

export {
    _mainLocalizer as localizer,
    // export `t` function for ease-of-use
    _t as t
};

//
// coreLocalizer manages language and locale parameters including translated strings
//
export function coreLocalizer() {

    let localizer = {};

    let _dataLanguages = {};

    // `_dataLocales` is an object containing all _supported_ locale codes -> language info.
    // * `rtl` - right-to-left or left-to-right text direction
    // * `pct` - the percent of strings translated; 1 = 100%, full coverage
    //
    // {
    // en: { rtl: false, pct: {…} },
    // de: { rtl: false, pct: {…} },
    // …
    // }
    let _dataLocales = {};

    // `localeStrings` is an object containing all _loaded_ locale codes -> string data.
    // {
    // en: { icons: {…}, toolbar: {…}, modes: {…}, operations: {…}, … },
    // de: { icons: {…}, toolbar: {…}, modes: {…}, operations: {…}, … },
    // …
    // }
    let _localeStrings = {};

    // the current locale
    let _localeCode = 'en-US';
    // `_localeCodes` must contain `_localeCode` first, optionally followed by fallbacks
    let _localeCodes = ['en-US', 'en'];
    let _languageCode = 'en';
    let _textDirection = 'ltr';
    let _usesMetric = false;
    let _languageNames = {};
    let _scriptNames = {};

    // getters for the current locale parameters
    localizer.localeCode = () => _localeCode;
    localizer.localeCodes = () => _localeCodes;
    localizer.languageCode = () => _languageCode;
    localizer.textDirection = () => _textDirection;
    localizer.usesMetric = () => _usesMetric;
    localizer.languageNames = () => _languageNames;
    localizer.scriptNames = () => _scriptNames;


    // The client app may want to manually set the locale, regardless of the
    // settings provided by the browser
    let _preferredLocaleCodes = [];
    localizer.preferredLocaleCodes = function(codes) {
        if (!arguments.length) return _preferredLocaleCodes;
        if (typeof codes === 'string') {
            // be generous and accept delimited strings as input
            _preferredLocaleCodes = codes.split(/,|;| /gi).filter(Boolean);
        } else {
            _preferredLocaleCodes = codes;
        }
        return localizer;
    };


    var _loadPromise;

    localizer.ensureLoaded = () => {

        if (_loadPromise) return _loadPromise;

        return _loadPromise = Promise.all([
                // load the list of languages
                fileFetcher.get('languages'),
                // load the list of supported locales
                fileFetcher.get('locales')
            ])
            .then(results => {
                _dataLanguages = results[0];
                _dataLocales = results[1];
            })
            .then(() => {
                let requestedLocales = (_preferredLocaleCodes || [])
                    // List of locales preferred by the browser in priority order.
                    // This always includes an `en` fallback, so we know at least one is valid.
                    .concat(utilDetect().browserLocales);

                _localeCodes = localesToUseFrom(requestedLocales);
                // run iD in the highest-priority locale; the rest are fallbacks
                _localeCode = _localeCodes[0];

                const loadStringsPromises = _localeCodes.map(function(code) {
                    return localizer.loadLocale(code);
                });
                return Promise.all(loadStringsPromises);
            })
            .then(() => {
                updateForCurrentLocale();
            })
            .catch(err => console.error(err));  // eslint-disable-line
    };

    // Returns the locales from `requestedLocales` supported by iD that we should use
    function localesToUseFrom(requestedLocales) {
        let supportedLocales = _dataLocales;

        let toLoad = [];

        for (let i in requestedLocales) {
            let locale = requestedLocales[i];
            if (supportedLocales[locale]) {
                toLoad.push(locale);
            }

            if (locale.includes('-')) {
                // Full locale ('es-ES'), add fallback to the base ('es')
                let langPart = locale.split('-')[0];
                if (supportedLocales[langPart]) {
                    toLoad.push(langPart);
                }
            }
        }

        toLoad = utilArrayUniq(toLoad);

        // this is guaranteed to always return an index since `en` is always listed
        // and `en` always has full coverage
        let fullCoverageIndex = toLoad.findIndex(function(locale) {
            return supportedLocales[locale].pct === 1;
        });
        // we only need to load locales up until we find one with full coverage
        return toLoad.slice(0, fullCoverageIndex + 1);
    }

    function updateForCurrentLocale() {
        if (!_localeCode) return;

        _languageCode = _localeCode.split('-')[0];

        const currentData = _dataLocales[_localeCode] || _dataLocales[_languageCode];

        const hash = utilStringQs(window.location.hash);

        if (hash.rtl === 'true') {
            _textDirection = 'rtl';
        } else if (hash.rtl === 'false') {
            _textDirection = 'ltr';
        }  else {
            _textDirection = currentData && currentData.rtl ? 'rtl' : 'ltr';
        }

        let locale = _localeCode;
        if (locale.toLowerCase() === 'en-us') locale = 'en';
        _languageNames = _localeStrings[locale].languageNames;
        _scriptNames = _localeStrings[locale].scriptNames;

        _usesMetric = _localeCode.slice(-3).toLowerCase() !== '-us';
    }


    /* Locales */
    // Returns a Promise to load the strings for the requested locale
    localizer.loadLocale = (requested) => {

        if (!_dataLocales) {
            return Promise.reject('loadLocale called before init');
        }

        let locale = requested;

        // US English is the default
        if (locale.toLowerCase() === 'en-us') locale = 'en';

        if (!_dataLocales[locale]) {
            return Promise.reject(`Unsupported locale: ${requested}`);
        }

        if (_localeStrings[locale]) {    // already loaded
            return Promise.resolve(locale);
        }

        let fileMap = fileFetcher.fileMap();
        const key = `locale_${locale}`;
        fileMap[key] = `locales/${locale}.json`;

        return fileFetcher.get(key)
            .then(d => {
                _localeStrings[locale] = d[locale];
                return locale;
            });
    };

    localizer.pluralRule = function(number) {
      return pluralRule(number, _localeCode);
    };

    // Returns the plural rule for the given `number` with the given `localeCode`.
    // One of: `zero`, `one`, `two`, `few`, `many`, `other`
    function pluralRule(number, localeCode) {

      // modern browsers have this functionality built-in
      const rules = 'Intl' in window && Intl.PluralRules && new Intl.PluralRules(localeCode);
      if (rules) {
        return rules.select(number);
      }

      // fallback to basic one/other, as in English
      if (number === 1) return 'one';
      return 'other';
    }

    /**
    * Given a string identifier, try to find that string in the current
    * language, and return it.  This function will be called recursively
    * with locale `en` if a string can not be found in the requested language.
    *
    * @param  {string}   stringId      string identifier
    * @param  {object?}  replacements  token replacements and default string
    * @param  {string?}  locale        locale to use (defaults to currentLocale)
    * @return {string?}  localized string
    */
    localizer.t = function(stringId, replacements, locale) {
        locale = locale || _localeCode;

        // US English is the default
        if (locale.toLowerCase() === 'en-us') locale = 'en';

        let path = stringId
          .split('.')
          .map(s => s.replace(/<TX_DOT>/g, '.'))
          .reverse();

        let result = _localeStrings[locale];

        while (result !== undefined && path.length) {
          result = result[path.pop()];
        }

        if (result !== undefined) {
          if (replacements) {
            if (typeof result === 'object' && Object.keys(result).length) {
                // If plural forms are provided, dig one level deeper based on the
                // first numeric token replacement provided.
                const number = Object.values(replacements).find(function(value) {
                  return typeof value === 'number';
                });
                if (number !== undefined) {
                  const rule = pluralRule(number, locale);
                  if (result[rule]) {
                    result = result[rule];
                  } else {
                    // We're pretty sure this should be a plural but no string
                    // could be found for the given rule. Just pick the first
                    // string and hope it makes sense.
                    result = Object.values(result)[0];
                  }
                }
            }
            if (typeof result === 'string') {
              for (let key in replacements) {
                let value = replacements[key];
                if (typeof value === 'number' && value.toLocaleString) {
                  // format numbers for the locale
                  value = value.toLocaleString(locale, {
                    style: 'decimal',
                    useGrouping: true,
                    minimumFractionDigits: 0
                  });
                }
                const token = `{${key}}`;
                const regex = new RegExp(token, 'g');
                result = result.replace(regex, value);
              }
            }
          }
          if (typeof result === 'string') {
            // found a localized string!
            return result;
          }
        }
        // no localized string found...

        // attempt to fallback to a lower-priority langauge
        let index = _localeCodes.indexOf(locale);
        if (index >= 0 && index < _localeCodes.length - 1) {
            // eventually this will be 'en' or another locale with 100% coverage
            let fallback = _localeCodes[index + 1];
            return localizer.t(stringId, replacements, fallback);
        }

        if (replacements && 'default' in replacements) {
          // Fallback to a default value if one is specified in `replacements`
          return replacements.default;
        }

        const missing = `Missing ${locale} translation: ${stringId}`;
        if (typeof console !== 'undefined') console.error(missing);  // eslint-disable-line

        return missing;
    };

    localizer.languageName = (code, options) => {

        if (_languageNames[code]) {  // name in locale language
          // e.g. "German"
          return _languageNames[code];
        }

        // sometimes we only want the local name
        if (options && options.localOnly) return null;

        const langInfo = _dataLanguages[code];
        if (langInfo) {
          if (langInfo.nativeName) {  // name in native language
            // e.g. "Deutsch (de)"
            return localizer.t('translate.language_and_code', { language: langInfo.nativeName, code: code });

          } else if (langInfo.base && langInfo.script) {
            const base = langInfo.base;   // the code of the language this is based on

            if (_languageNames[base]) {   // base language name in locale language
              const scriptCode = langInfo.script;
              const script = _scriptNames[scriptCode] || scriptCode;
              // e.g. "Serbian (Cyrillic)"
              return localizer.t('translate.language_and_code', { language: _languageNames[base], code: script });

            } else if (_dataLanguages[base] && _dataLanguages[base].nativeName) {
              // e.g. "српски (sr-Cyrl)"
              return localizer.t('translate.language_and_code', { language: _dataLanguages[base].nativeName, code: code });
            }
          }
        }
        return code;  // if not found, use the code
    };

    return localizer;
}
