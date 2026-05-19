import { select as d3_select } from 'd3-selection';
import { escape } from 'es-toolkit/compat';

import { fileFetcher } from './file_fetcher';
import { utilDetect } from '../util/detect';
import { utilStringQs } from '../util';
import { utilArrayUniq } from '../util/array';
import { presetsCdnUrl } from '../../config/id.js';

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
    localizer.languages = () => _dataLanguages; // Expose all the languages supported


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
        _loadPromise = undefined;
        return localizer;
    };


    var _loadPromise;

    localizer.ensureLoaded = () => {
        if (_loadPromise) return _loadPromise;

        let filesToFetch = [
            'languages',  // load the list of languages
            'locales'     // load the list of supported locales
        ];

        const localeDirs = {
            general: 'locales',
            tagging: presetsCdnUrl + 'dist/translations'
        };

        let fileMap = fileFetcher.fileMap();
        for (let scopeId in localeDirs) {
            const key = `locales_index_${scopeId}`;
            if (!fileMap[key]) {
                fileMap[key] = localeDirs[scopeId] + '/index.min.json';
            }
            filesToFetch.push(key);
        }

        return _loadPromise = Promise.all(filesToFetch.map(key => fileFetcher.get(key)))
            .then(results => {
                _dataLanguages = results[0];
                _dataLocales = results[1];

                let indexes = results.slice(2);

                _localeCodes = localizer.localesToUseFrom(_dataLocales);
                _localeCode = _localeCodes[0];   // Run iD in the highest-priority locale; the rest are fallbacks

                let loadStringsPromises = [];

                indexes.forEach((index, i) => {
                    // Will always return the index for `en` if nothing else
                    const fullCoverageIndex = _localeCodes.findIndex(function(locale) {
                        return index[locale] && index[locale].pct === 1;
                    });
                    // We only need to load locales up until we find one with full coverage
                    _localeCodes.slice(0, fullCoverageIndex + 1).forEach(function(code) {
                        let scopeId = Object.keys(localeDirs)[i];
                        let directory = Object.values(localeDirs)[i];
                        if (index[code]) loadStringsPromises.push(localizer.loadLocale(code, scopeId, directory));
                    });
                });

                return Promise.all(loadStringsPromises);
            })
            .then(() => {
                updateForCurrentLocale();
            })
            .catch(err => console.error(err));  // eslint-disable-line
    };

    // Returns the locales from `requestedLocales` supported by iD that we should use
    /** @param {{ [locale: string]: unknown }} supportedLocales */
    localizer.localesToUseFrom = (supportedLocales) => {
        const requestedLocales = [
          ...(_preferredLocaleCodes || []),
          ...utilDetect().browserLocales,  // List of locales preferred by the browser in priority order.
          'en',  // fallback to English since it's the only guaranteed complete language
        ];

        /** @type {string[]} */
        let toUse = [];
        for (const locale of requestedLocales) {
            if (supportedLocales[locale]) toUse.push(locale);

            if ('Intl' in window && 'Locale' in window.Intl) {
                // Full locale ('es-ES'), add fallback to the base ('es')
                const localeObj = new Intl.Locale(locale);
                const withoutScript = `${localeObj.language}-${localeObj.region}`;
                const base = localeObj.language;

                if (supportedLocales[withoutScript]) toUse.push(withoutScript);
                if (supportedLocales[base]) toUse.push(base);
            } else if (locale.includes('-')) {
                // legacy logic: if Intl.Locale is not available
                let langPart = locale.split('-')[0];
                if (supportedLocales[langPart]) toUse.push(langPart);
            }
        }
        // remove duplicates
        return utilArrayUniq(toUse);
    };

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

        // some locales (like fr-FR) have no languageNames or scriptNames,
        // so we need to load them from the base language (see #8673)
        _languageNames = (
          _localeStrings.general[locale].languageNames ||
          _localeStrings.general[_languageCode].languageNames
        );
        _scriptNames = (
          _localeStrings.general[locale].scriptNames ||
          _localeStrings.general[_languageCode].scriptNames
        );

        _usesMetric = _localeCode.slice(-3).toLowerCase() !== '-us';
    }


    /* Locales */
    // Returns a Promise to load the strings for the requested locale
    localizer.loadLocale = (locale, scopeId, directory) => {

        // US English is the default
        if (locale.toLowerCase() === 'en-us') locale = 'en';

        if (_localeStrings[scopeId] && _localeStrings[scopeId][locale]) {    // already loaded
            return Promise.resolve(locale);
        }

        let fileMap = fileFetcher.fileMap();
        const key = `locale_${scopeId}_${locale}`;
        if (!fileMap[key]) {
            fileMap[key] = `${directory}/${locale}.min.json`;
        }

        return fileFetcher.get(key)
            .then(d => {
                if (!_localeStrings[scopeId]) _localeStrings[scopeId] = {};
                _localeStrings[scopeId][locale] = d[locale];
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
    * Try to find that string in `locale` or the current `_localeCode` matching
    * the given `stringId`. If no string can be found in the requested locale,
    * we'll recurse down all the `_localeCodes` until one is found.
    *
    * @param  {string}   origStringId  string identifier
    * @param  {object?}  replacements  token replacements and default string
    * @param  {string?}  locale        locale to use (defaults to currentLocale)
    * @return {{locale: string, texts: [string|function]}} a list of localized strings and replacement parts
    */
    localizer.tInfo = function(origStringId, replacements, locale) {
        let stringId = origStringId.trim();

        let scopeId = 'general';

        if (stringId[0] === '_') {
            let split = stringId.split('.');
            scopeId = split[0].slice(1);
            stringId = split.slice(1).join('.');
        }

        locale = locale || _localeCode;

        let path = stringId
            .split('.')
            .map(s => s.replace(/<TX_DOT>/g, '.'))
            .reverse();

        let stringsKey = locale;
        // US English is the default
        if (stringsKey.toLowerCase() === 'en-us') stringsKey = 'en';
        let localeString = _localeStrings && _localeStrings[scopeId] && _localeStrings[scopeId][stringsKey];

        while (localeString !== undefined && path.length) {
            localeString = localeString[path.pop()];
        }

        if (localeString !== undefined) {
            if (replacements) {
              if (typeof localeString === 'object' && Object.keys(localeString).length) {
                  // If plural forms are provided, dig one level deeper based on the
                  // first numeric token replacement provided.
                  const number = Object.values(replacements).find(function(value) {
                    return typeof value === 'number';
                  });
                  if (number !== undefined) {
                    const rule = pluralRule(number, locale);
                    if (localeString[rule]) {
                      localeString = localeString[rule];
                    } else {
                      // We're pretty sure this should be a plural but no string
                      // could be found for the given rule. Just pick the first
                      // string and hope it makes sense.
                      localeString = Object.values(localeString)[0];
                    }
                  }
              }
              if (typeof localeString === 'string') {
                let parts = [localeString];
                for (let key in replacements) {
                  const token = `{${key}}`;
                  const regex = new RegExp(token, 'g');
                  parts = parts.flatMap(part => {
                    if (typeof part === 'object') return part;
                    return part
                      .split(regex)
                      .flatMap(p => [{key}, p])
                      .slice(1);
                  });
                }

                const result = parts.map(part => {
                  if (typeof part === 'object') {
                    const value = replacements[part.key];

                    if (typeof value === 'number') {
                      if (value.toLocaleString) {
                        // format numbers for the locale
                        return value.toLocaleString(locale, {
                          style: 'decimal',
                          useGrouping: true,
                          minimumFractionDigits: 0
                        });
                      } else {
                        return value.toString();
                      }
                    }

                    return value;
                  }

                  return part;
                });

                return {
                  texts: result,
                  locale
                };
            }
            return {
              texts: Array.isArray(localeString) ? localeString : [localeString],
              locale
            };
          }
        }
        // no localized string found...

        // attempt to fallback to a lower-priority language
        let index = _localeCodes.indexOf(locale);
        if (index >= 0 && index < _localeCodes.length - 1) {
            // eventually this will be 'en' or another locale with 100% coverage
            let fallback = _localeCodes[index + 1];
            return localizer.tInfo(origStringId, replacements, fallback);
        }

        if (replacements && 'default' in replacements) {
          // Fallback to a default value if one is specified in `replacements`
          return {
              texts: [replacements.default],
              locale: null
          };
        }

        const missing = `Missing ${locale} translation: ${origStringId}`;
        if (typeof console !== 'undefined') console.error(missing);  // eslint-disable-line

        return {
            texts: [missing],
            locale: 'en'
        };
    };

    localizer.hasTextForStringId = function(stringId) {
        return !!localizer.tInfo(stringId, { default: 'nothing found'}).locale;
    };

    // Returns only the localized text, discarding the locale info
    localizer.t = function(stringId, replacements, locale) {
        return localizer.tInfo(stringId, replacements, locale).texts.join('');
    };

    // Returns the localized text wrapped in an HTML element encoding the locale info
    /**
     * @deprecated This method is considered deprecated. Instead, use the direct DOM manipulating
     *             method `t.append`.
     */
    localizer.t.html = function(stringId, replacements, locale) {
      // replacement string might be html unsafe, so we need to escape it except if it is explicitly marked as html code
      replacements = Object.assign({}, replacements);
      for (var k in replacements) {
        if (typeof replacements[k] === 'string') {
          replacements[k] = escape(replacements[k]);
        }
        if (typeof replacements[k] === 'object' && typeof replacements[k].html === 'string') {
          replacements[k] = replacements[k].html;
        }
      }

      const info = localizer.tInfo(stringId, replacements, locale);
      // text may be empty or undefined if `replacements.default` is
      const text = info.texts.join('');
      if (text) {
        return `<span class="localized-text" lang="${info.locale || 'und'}">${text}</span>`;
      } else {
        return '';
      }
    };

    // Adds localized text wrapped as an HTML span element with locale info to the DOM
    localizer.t.append = function(stringId, replacements, locale) {
      const ret = function(selection) {
        const info = localizer.tInfo(stringId, replacements, locale);
        const texts = [
          replacements?.prefix,
          ...info.texts,
          replacements?.suffix
        ].filter(Boolean);

        texts.forEach(text => {
          if (typeof text === 'string') {
            selection.append('span')
              .attr('class', 'localized-text')
              .attr('lang', info.locale || 'und')
              .text(replacements?._trim ? text.trim() : text);
          } else {
            selection.call(text);
          }
        });
      };
      ret.stringId = stringId;
      return ret;
    };

    // Adds or updates a localized text wrapped as an HTML span element with locale info to the DOM
    localizer.t.addOrUpdate = function(stringId, replacements, locale) {
      const ret = function(selection) {
        const info = localizer.tInfo(stringId, replacements, locale);
        const texts = [
          replacements?.prefix,
          ...info.texts,
          replacements?.suffix
        ].filter(Boolean);

        const span = selection.selectAll('span')
          .data(texts.map((_, i) => i), d => stringId + d);
        span.exit().remove();
        const enter = span.enter()
          .append('span');
        span.merge(enter).each(function(d) {
          const text = texts[d];
          if (typeof text === 'string') {
            d3_select(this)
              .classed('localized-text', true)
              .attr('lang', info.locale || 'und')
              .text(replacements?._trim ? text.trim() : text);
          } else {
            d3_select(this).call(text);
          }
        });
      };
      ret.stringId = stringId;
      return ret;
    };

    localizer.languageName = (code, options) => {

        if (_languageNames && _languageNames[code]) {  // name in locale language
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

            if (_languageNames && _languageNames[base]) {   // base language name in locale language
              const scriptCode = langInfo.script;
              const script = (_scriptNames && _scriptNames[scriptCode]) || scriptCode;
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

    /**
     * Returns a function that formats a floating-point number in the given
     * locale.
     */
    localizer.floatFormatter = (locale) => {
        if (!('Intl' in window && 'NumberFormat' in Intl &&
              'formatToParts' in Intl.NumberFormat.prototype)) {
            return (number, fractionDigits) => {
                return fractionDigits === undefined ? number.toString() : number.toFixed(fractionDigits);
            };
        } else {
            return (number, fractionDigits) => number.toLocaleString(locale, {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits === undefined ? 20 : fractionDigits,
            });
        }
    };

    /**
     * Returns a function that parses a number formatted according to the given
     * locale as a floating-point number.
     */
    localizer.floatParser = (locale) => {
        // https://stackoverflow.com/a/55366435/4585461
        const polyfill = (string) => +string.trim();
        if (!('Intl' in window && 'NumberFormat' in Intl)) return polyfill;
        const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 20 });
        if (!('formatToParts' in format)) return polyfill;
        const parts = format.formatToParts(-12345.6);
        const numerals = Array.from({ length: 10 }).map((_, i) => format.format(i));
        const index = new Map(numerals.map((d, i) => [d, i]));
        const literalPart = parts.find(d => d.type === 'literal');
        const literal = literalPart && new RegExp(`[${literalPart.value}]`, 'g');
        const groupPart = parts.find(d => d.type === 'group');
        const group = groupPart && new RegExp(`[${groupPart.value}]`, 'g');
        const decimalPart = parts.find(d => d.type === 'decimal');
        const decimal = decimalPart && new RegExp(`[${decimalPart.value}]`);
        const numeral = new RegExp(`[${numerals.join('')}]`, 'g');
        const getIndex = d => index.get(d);
        return (string) => {
            string = string.trim();
            if (literal) string = string.replace(literal, '');
            if (group) string = string.replace(group, '');
            if (decimal) string = string.replace(decimal, '.');
            string = string.replace(numeral, getIndex);
            return string ? +string : NaN;
        };
    };

    /**
     * Returns a function that returns the number of decimal places in a
     * formatted number string.
     */
    localizer.decimalPlaceCounter = (locale) => {
        var literal, group, decimal;
        if ('Intl' in window && 'NumberFormat' in Intl) {
            const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 20 });
            if ('formatToParts' in format) {
                const parts = format.formatToParts(-12345.6);
                const literalPart = parts.find(d => d.type === 'literal');
                literal = literalPart && new RegExp(`[${literalPart.value}]`, 'g');
                const groupPart = parts.find(d => d.type === 'group');
                group = groupPart && new RegExp(`[${groupPart.value}]`, 'g');
                const decimalPart = parts.find(d => d.type === 'decimal');
                decimal = decimalPart && new RegExp(`[${decimalPart.value}]`);
            }
        }
        return (string) => {
            string = string.trim();
            if (literal) string = string.replace(literal, '');
            if (group) string = string.replace(group, '');
            const parts = string.split(decimal || '.');
            return parts && parts[1] && parts[1].length || 0;
        };
    };

    return localizer;
}
