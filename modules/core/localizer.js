import { fileFetcher } from './file_fetcher';
import { utilDetect } from '../util/detect';
import { utilStringQs } from '../util';

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

    // `localeData` is an object containing all _supported_ locale codes -> language info.
    // {
    // en: { rtl: false, languageNames: {…}, scriptNames: {…} },
    // de: { rtl: false, languageNames: {…}, scriptNames: {…} },
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

    // the current locale parameters
    let _localeCode = 'en-US';
    let _languageCode = 'en';
    let _textDirection = 'ltr';
    let _usesMetric = false;
    let _languageNames = {};
    let _scriptNames = {};

    // getters for the current locale parameters
    localizer.localeCode = () => _localeCode;
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
                    // list of locales preferred by the browser in priority order
                    .concat(utilDetect().browserLocales);
                _localeCode = bestSupportedLocale(requestedLocales);

                return Promise.all([
                    // always load the English locale strings as fallbacks
                    localizer.loadLocale('en'),
                    // load the preferred locale
                    localizer.loadLocale(_localeCode)
                ]);
            })
            .then(() => {
                updateForCurrentLocale();
            })
            .catch(err => console.error(err));  // eslint-disable-line
    };

    // Returns the best locale from `locales` supported by iD, if any
    function bestSupportedLocale(locales) {
        let supportedLocales = _dataLocales;

        for (let i in locales) {
            let locale = locales[i];
            if (locale.includes('-')) { // full locale ('es-ES')

                if (supportedLocales[locale]) return locale;

                // If full locale not supported ('es-FAKE'), fallback to the base ('es')
                let langPart = locale.split('-')[0];
                if (supportedLocales[langPart]) return langPart;

            } else { // base locale ('es')

                // prefer a lower-priority full locale with this base ('es' < 'es-ES')
                let fullLocale = locales.find((locale2, index) => {
                    return index > i &&
                        locale2 !== locale &&
                        locale2.split('-')[0] === locale &&
                        supportedLocales[locale2];
                });
                if (fullLocale) return fullLocale;

                if (supportedLocales[locale]) return locale;
            }
        }

        return null;
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

        _languageNames = currentData && currentData.languageNames;
        _scriptNames = currentData && currentData.scriptNames;

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

    /**
    * Given a string identifier, try to find that string in the current
    * language, and return it.  This function will be called recursively
    * with locale `en` if a string can not be found in the requested language.
    *
    * @param  {string}   s             string identifier
    * @param  {object?}  replacements  token replacements and default string
    * @param  {string?}  locale        locale to use (defaults to currentLocale)
    * @return {string?}  localized string
    */
    localizer.t = function(s, replacements, locale) {
        locale = locale || _localeCode;

        // US English is the default
        if (locale.toLowerCase() === 'en-us') locale = 'en';

        let path = s
          .split('.')
          .map(s => s.replace(/<TX_DOT>/g, '.'))
          .reverse();

        let result = _localeStrings[locale];

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
          return localizer.t(s, replacements, 'en');  // fallback - recurse with 'en'
        }

        if (replacements && 'default' in replacements) {
          return replacements.default;      // fallback - replacements.default
        }

        const missing = `Missing ${locale} translation: ${s}`;
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
