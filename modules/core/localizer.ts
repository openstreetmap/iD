import { select as d3_select } from 'd3-selection';
import { escape } from 'es-toolkit/compat';

import { fileFetcher } from './file_fetcher';
import { utilDetect } from '../util/detect';
import { utilExpandLocaleCode, utilStringQs } from '../util';
import { utilArrayUniq } from '../util/array';
import { presetsCdnUrl } from '../../config/id.js';

export type LanguagesJSON = {
    [localeCode: string]: {
        base?: string,
        script?: string,
        nativeName?: string
    }
};

export type LocalesJSON = {
    [localeCode: string]: {
        /** right-to-left or left-to-right text direction */
        rtl: boolean;
        /** the percent of strings translated; 1 = 100%, full coverage */
        pct: number;
    }
};

type TranslationStrings = { [key: string]: any | TranslationStrings };
export type Translations = {
    [key: string]: TranslationStrings,
} & {
    languageNames?: Record<string, string>,
    scriptNames?: Record<string, string>
};

export type LocaleIndexKey = `locales_index_${string}`; // e.g. 'locales_index_genera'
export type LocaleDataKey = `locale_${string}_${string}`; // e.g. 'locales_genera_es'


/** the return type from `t.append()` */
export interface LocalizedTextRenderer extends d3.Selector {
    stringId: string
};

/** the return type from `tInfo()` */
type TInfo = {
    locale: string | null,
    texts: (string | d3.Selector)[]
};

export type Replacements = {
    [key: string]: number | string | d3.Selector | undefined
} & {
    default?: string,
    prefix?: string,
    suffix?: string
};
export type ReplacementsSimple = {
    [key: string]: number | string | undefined
} & {
    default?: string
};
type ReplacementsSimpleMulti = {
    [key: string]: number | string | string[] | undefined
} & {
    default?: string[]
};
type ReplacementsHTML = {
    [key: string]: string | { html: string}
} & {
    default?: string
};

//
// coreLocalizer manages language and locale parameters including translated strings
//
export class coreLocalizer {
    private _dataLanguages: LanguagesJSON = {};

    // `_dataLocales` is an object containing all _supported_ locale codes -> language info.
    // * `rtl` - right-to-left or left-to-right text direction
    // * `pct` - the percent of strings translated; 1 = 100%, full coverage
    //
    // {
    //   en: { rtl: false, pct: {…} },
    //   de: { rtl: false, pct: {…} },
    //   …
    // }
    private _dataLocales: LocalesJSON = {};

    // `localeStrings` is an object containing all _loaded_ locale codes by scope -> string data.
    // {
    //   general: {
    //     en: { icons: {…}, toolbar: {…}, modes: {…}, operations: {…}, … },
    //     de: { icons: {…}, toolbar: {…}, modes: {…}, operations: {…}, … },
    //     …
    //   }, …
    // }
    private _localeStrings: { [scope: string]: { [locale: string]: Translations }} = {};

    // the current locale
    private _localeCode = 'en-US';
    // `_localeCodes` must contain `_localeCode` first, optionally followed by fallbacks
    private _localeCodes = ['en-US', 'en'];
    private _expandedLocaleCodes = utilExpandLocaleCode(this._localeCode);
    private _languageCode = 'en';
    private _textDirection: 'ltr' | 'rtl' = 'ltr';
    private _usesMetric = false;
    private _languageNames: Record<string, string> = {};
    private _scriptNames: Record<string, string> = {};

    // getters for the current locale parameters
    localeCode() {
        return this._localeCode;
    }
    localeCodes() {
        return this._localeCodes;
    }
    expandedLocaleCodes() {
        return this._expandedLocaleCodes;
    }
    languageCode() {
        return this._languageCode;
    }
    textDirection() {
        return this._textDirection;
    }
    usesMetric() {
        return this._usesMetric;
    }
    languageNames() {
        return this._languageNames;
    }
    scriptNames() {
        return this._scriptNames;
    }
    languages() {
        return this._dataLanguages; // Expose all the languages supported
    }

    // The client app may want to manually set the locale, regardless of the
    // settings provided by the browser
    private _preferredLocaleCodes: string[] = [];
    preferredLocaleCodes(codes: string | string[]) {
        if (!arguments.length) return this._preferredLocaleCodes;
        if (typeof codes === 'string') {
            // be generous and accept delimited strings as input
            this._preferredLocaleCodes = codes.split(/,|;| /gi).filter(Boolean);
        } else {
            this._preferredLocaleCodes = codes;
        }
        this._loadPromise = undefined;
        return this;
    }


    private _loadPromise?: Promise<this>;

    ensureLoaded() {
        if (this._loadPromise) return this._loadPromise;

        let filesToFetch: LocaleIndexKey[] = [];

        const localeDirs = {
            general: 'locales',
            tagging: presetsCdnUrl + 'dist/translations'
        };

        let fileMap = fileFetcher.fileMap();
        for (const [scopeId, dir] of Object.entries(localeDirs)) {
            const key: LocaleIndexKey = `locales_index_${scopeId}`;
            if (!fileMap[key]) {
                fileMap[key] = dir + '/index.min.json';
            }
            filesToFetch.push(key);
        }


        return this._loadPromise = Promise.all([
                fileFetcher.get('languages'),
                fileFetcher.get('locales'),
                ...filesToFetch.map(key => fileFetcher.get(key))
            ]).then(([languages, locales, ...indexes]) => {
                this._dataLanguages = languages;
                this._dataLocales = locales;

                this._localeCodes = this.localesToUseFrom(this._dataLocales);
                this._localeCode = this._localeCodes[0];   // Run iD in the highest-priority locale; the rest are fallbacks
                this._expandedLocaleCodes = utilExpandLocaleCode(this._localeCode);

                let loadStringsPromises: Promise<string>[] = [];

                indexes.forEach((index, i) => {
                    // Will always return the index for `en` if nothing else
                    const fullCoverageIndex = this._localeCodes.findIndex((locale) =>
                        index[locale] && index[locale].pct === 1);
                    // We only need to load locales up until we find one with full coverage
                    this._localeCodes.slice(0, fullCoverageIndex + 1).forEach((code) => {
                        let scopeId = Object.keys(localeDirs)[i];
                        let directory = Object.values(localeDirs)[i];
                        if (index[code]) loadStringsPromises.push(this.loadLocale(code, scopeId, directory));
                    });
                });

                return Promise.all(loadStringsPromises);
            })
            .then(() => {
                this._updateForCurrentLocale();
                return this;
            })
            .catch(err => {
                console.error(err);  // eslint-disable-line
                throw err;
            });
    };

    // Returns the locales from `requestedLocales` supported by iD that we should use
    localesToUseFrom(supportedLocales: Record<string, unknown>) {
        const requestedLocales = [
          ...(this._preferredLocaleCodes || []),
          ...utilDetect().browserLocales,  // List of locales preferred by the browser in priority order.
          'en',  // fallback to English since it's the only guaranteed complete language
        ];

        let toUse: string[] = [];
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

    private _updateForCurrentLocale() {
        if (!this._localeCode) return;

        this._languageCode = this._localeCode.split('-')[0];

        const currentData = this._dataLocales[this._localeCode] || this._dataLocales[this._languageCode];

        const hash = utilStringQs(window.location.hash);

        if (hash.rtl === 'true') {
            this._textDirection = 'rtl';
        } else if (hash.rtl === 'false') {
            this._textDirection = 'ltr';
        }  else {
            this._textDirection = currentData && currentData.rtl ? 'rtl' : 'ltr';
        }

        let locale = this._localeCode;
        if (locale.toLowerCase() === 'en-us') locale = 'en';

        // some locales (like fr-FR) have no languageNames or scriptNames,
        // so we need to load them from the base language (see #8673)
        this._languageNames = (
            this._localeStrings.general[locale].languageNames! ||
            this._localeStrings.general[this._languageCode].languageNames!
        );
        this._scriptNames = (
            this._localeStrings.general[locale].scriptNames! ||
            this._localeStrings.general[this._languageCode].scriptNames!
        );

        this._usesMetric = this._localeCode.slice(-3).toLowerCase() !== '-us';
    }


    /* Locales */
    // Returns a Promise to load the strings for the requested locale
    loadLocale(locale: string, scopeId: string, directory: string) {
        // US English is the default
        if (locale.toLowerCase() === 'en-us') locale = 'en';

        if (this._localeStrings[scopeId] && this._localeStrings[scopeId][locale]) {    // already loaded
            return Promise.resolve(locale);
        }

        let fileMap = fileFetcher.fileMap();
        const key: LocaleDataKey = `locale_${scopeId}_${locale}`;
        if (!fileMap[key]) {
            fileMap[key] = `${directory}/${locale}.min.json`;
        }

        return fileFetcher.get(key)
            .then(d => {
                if (!this._localeStrings[scopeId]) this._localeStrings[scopeId] = {};
                this._localeStrings[scopeId][locale] = d[locale];
                return locale;
            });
    };

    pluralRule(number: number) {
        return this._pluralRule(number, this._localeCode);
    };

    // Returns the plural rule for the given `number` with the given `localeCode`.
    // One of: `zero`, `one`, `two`, `few`, `many`, `other`
    private _pluralRule = function(number: number, localeCode: string) {

      // modern browsers have this functionality built-in
      const rules = 'Intl' in window && Intl.PluralRules && new Intl.PluralRules(localeCode);
      if (rules) {
          return rules.select(number);
      }

      // fallback to basic one/other, as in English
      if (number === 1) return 'one';
      return 'other';
    };

    /**
    * Try to find that string in `locale` or the current `_localeCode` matching
    * the given `stringId`. If no string can be found in the requested locale,
    * we'll recurse down all the `_localeCodes` until one is found.
    *
    * @param  origStringId  string identifier
    * @param  replacements  token replacements and default string
    * @param  locale        locale to use (defaults to currentLocale)
    * @return a list of localized strings and replacement parts
    */
    tInfo(origStringId: string, replacements?: Replacements, locale?: string): TInfo | TInfo[] {
        let stringId = origStringId.trim();

        let scopeId = 'general';

        if (stringId[0] === '_') {
            let split = stringId.split('.');
            scopeId = split[0].slice(1);
            stringId = split.slice(1).join('.');
        }

        locale = locale || this._localeCode;

        let path = stringId
            .split('.')
            .map(s => s.replace(/<TX_DOT>/g, '.'))
            .reverse();

        let stringsKey = locale;
        // US English is the default
        if (stringsKey.toLowerCase() === 'en-us') stringsKey = 'en';

        let localeStringTree: TranslationStrings = this._localeStrings && this._localeStrings[scopeId] && this._localeStrings[scopeId][stringsKey];
        while (localeStringTree !== undefined && path.length > 1) {
            localeStringTree = localeStringTree[path.pop()!];
        }
        let localeString = localeStringTree?.[path.pop()!];

        if (Array.isArray(localeString)) {
            // found an array of localized strings!
            // for example: `terms` or `aliases` from id-tagging-schema
            // -> resolve each string of the array individually
            return localeString.map((_, idx) =>
                this.tInfo(`${origStringId}.${idx}`, replacements, locale) as TInfo);
        }

        if (localeString !== undefined) {
            if (replacements) {
                if (typeof localeString === 'object' && Object.keys(localeString).length) {
                    // If plural forms are provided, dig one level deeper based on the
                    // first numeric token replacement provided.
                    const number = Object.values(replacements).find((value) =>
                        typeof value === 'number');
                    if (number !== undefined) {
                        const rule = this._pluralRule(number, locale);
                        if (localeString[rule]) {
                            localeString = localeString[rule];
                        } else {
                            // We're pretty sure this should be a plural but no string
                            // could be found for the given rule. Just pick the first
                            // string and hope it makes sense.
                            localeString = Object.values(localeString)[0];
                            console.warn(`plural form not found for "${rule}" of "${stringId}"`);  // eslint-disable-line
                        }
                    }
                }
                if (typeof localeString === 'string') {
                    let parts: (string | { key: string })[] = [localeString];
                    for (let key in replacements) {
                        const token = `{${key}}`;
                        // replace every instance of `{key}` with a placeholder object {key: 'key'}
                        parts = parts.flatMap(part => {
                            if (typeof part === 'object') return part;
                            return part
                                .split(token)
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
                  }).filter(Boolean);

                  return {
                      texts: result,
                      locale
                  };
                }
            }
            return {
                texts: [localeString],
                locale
            };
        }
        // no localized string found...

        // attempt to fallback to a lower-priority language
        let index = this._localeCodes.indexOf(locale);
        if (index >= 0 && index < this._localeCodes.length - 1) {
            // eventually this will be 'en' or another locale with 100% coverage
            let fallback = this._localeCodes[index + 1];
            return this.tInfo(origStringId, replacements, fallback);
        }

        if (replacements && 'default' in replacements) {
            // Fallback to a default value if one is specified in `replacements`
            return {
                texts: [replacements.default!],
                locale: null
            };
        }

        const missing = `Missing translation: ${origStringId}`;
        console.error(`${missing} (last tried locale: ${locale})`);  // eslint-disable-line

        return {
            texts: [missing],
            locale: 'en'
        };
    };

    hasTextForStringId(stringId: string, locale?: string) {
        const info = this.tInfo(stringId, { default: 'nothing found'}, locale);
        if (Array.isArray(info)) return info[0].locale !== null;
        return info.locale !== null;
    };

    // Returns only the localized text, discarding the locale info
    t(stringId: string, replacements?: ReplacementsSimple, locale?: string): string {
        const info = this.tInfo(stringId, replacements, locale);
        if (Array.isArray(info)) {
            console.error(`${stringId} is unexpectedly an array of texts`);  // eslint-disable-line
            return '';
        }
        return info.texts.join('');
    };

    // Returns only the localized text, discarding the locale info
    t_all(stringId: string, replacements?: ReplacementsSimpleMulti, locale?: string): string[] {
        /*if (!localizer.hasTextForStringId(stringId, locale)) {
            console.error(`Missing translation: ${stringId}`);  // eslint-disable-line
            return [];
        }*/
        const infos = this.tInfo(stringId, { ...replacements, default: 'nothing found' }, locale);
        if (!Array.isArray(infos)) {
            if (replacements && 'default' in replacements) return replacements.default!;
            console.error(`Missing translation: ${stringId} (expected: array of texts)`);  // eslint-disable-line
            return [];
        }
        return infos.map(tInfo => tInfo.texts.join(''));
    };

    // Returns the localized text wrapped in an HTML element encoding the locale info
    /**
     * @deprecated This method is considered deprecated. Instead, use the direct DOM manipulating
     *             method `t_append`.
     */
    t_html(stringId: string, replacements?: ReplacementsHTML, locale?: string) {
        // replacement string might be html unsafe, so we need to escape it except if it is explicitly marked as html code
        replacements = Object.assign({}, replacements);
        for (var k in replacements) {
            const replacementValue = replacements[k];
            if (typeof replacementValue === 'string') {
                replacements[k] = escape(replacementValue);
            }
            if (typeof replacementValue === 'object' && typeof replacementValue.html === 'string') {
                replacements[k] = replacementValue.html;
            }
        }

        const info = this.tInfo(stringId, replacements as ReplacementsSimple, locale);
        if (Array.isArray(info)) {
            console.error(`${stringId} is unexpectedly an array of texts`);  // eslint-disable-line
            return '';
        }
        // text may be empty or undefined if `replacements.default` is
        const text = info.texts.join('');
        if (text) {
            return `<span class="localized-text" lang="${info.locale || 'und'}">${text}</span>`;
        } else {
            return '';
        }
    };

    // Adds localized text wrapped as an HTML span element with locale info to the DOM
    t_append(stringId: string, replacements?: Replacements, locale?: string): LocalizedTextRenderer {
        const ret: LocalizedTextRenderer = <T extends HTMLElement>(selection: d3.Selection<T>) => {
            const info = this.tInfo(stringId, replacements, locale);
            if (Array.isArray(info)) {
                console.error(`${stringId} is unexpectedly an array of texts`);  // eslint-disable-line
                return;
            }
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
    t_addOrUpdate(stringId: string, replacements?: Replacements, locale?: string): LocalizedTextRenderer {
        const ret: LocalizedTextRenderer = <T extends HTMLElement>(selection: d3.Selection<T>) => {
            const info = this.tInfo(stringId, replacements, locale);
            if (Array.isArray(info)) {
                console.error(`${stringId} is unexpectedly an array of texts`);  // eslint-disable-line
                return;
            }
            const texts = [
                replacements?.prefix,
                ...info.texts,
                replacements?.suffix
            ].filter(Boolean);

            const span = selection.selectAll<HTMLSpanElement, any>('span')
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

    languageName(code: string, options?: { localOnly?: boolean }) {
        if (this._languageNames && this._languageNames[code]) {  // name in locale language
            // e.g. "German"
            return this._languageNames[code];
        }

        // sometimes we only want the local name
        if (options && options.localOnly) return null;

        const langInfo = this._dataLanguages[code];
        if (langInfo) {
            if (langInfo.nativeName) {  // name in native language
                // e.g. "Deutsch (de)"
                return this.t('translate.language_and_code', { language: langInfo.nativeName, code: code });

            } else if (langInfo.base && langInfo.script) {
                const base = langInfo.base;   // the code of the language this is based on

                if (this._languageNames && this._languageNames[base]) {   // base language name in locale language
                    const scriptCode = langInfo.script;
                    const script = (this._scriptNames && this._scriptNames[scriptCode]) || scriptCode;
                    // e.g. "Serbian (Cyrillic)"
                    return this.t('translate.language_and_code', { language: this._languageNames[base], code: script });
                } else if (this._dataLanguages[base] && this._dataLanguages[base].nativeName) {
                    // e.g. "српски (sr-Cyrl)"
                    return this.t('translate.language_and_code', { language: this._dataLanguages[base].nativeName, code: code });
                }
            }
        }
        return code;  // if not found, use the code
    };

    /**
     * Returns a function that formats a floating-point number in the given
     * locale.
     */
    floatFormatter(locale?: string) {
        if (!('Intl' in window && 'NumberFormat' in Intl &&
              'formatToParts' in Intl.NumberFormat.prototype)) {
            return (number: number, fractionDigits?: number) => {
                return fractionDigits === undefined ? number.toString() : number.toFixed(fractionDigits);
            };
        } else {
            return (number: number, fractionDigits?: number) => number.toLocaleString(locale, {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits === undefined ? 20 : fractionDigits,
            });
        }
    };

    /**
     * Returns a function that parses a number formatted according to the given
     * locale as a floating-point number.
     */
    floatParser(locale: string) {
        // https://stackoverflow.com/a/55366435/4585461
        const polyfill = (string: string) => +string.trim();
        if (!('Intl' in window && 'NumberFormat' in Intl)) return polyfill;
        const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 20 });
        if (!('formatToParts' in format)) return polyfill;
        const parts = format.formatToParts(-12345.6);
        const numerals = Array.from({ length: 10 }).map((_, i) => format.format(i));
        const index = new Map(numerals.map((d, i) => [d, String(i)]));
        const literalPart = parts.find(d => d.type === 'literal');
        const literal = literalPart && new RegExp(`[${literalPart.value}]`, 'g');
        const groupPart = parts.find(d => d.type === 'group');
        const group = groupPart && new RegExp(`[${groupPart.value}]`, 'g');
        const decimalPart = parts.find(d => d.type === 'decimal');
        const decimal = decimalPart && new RegExp(`[${decimalPart.value}]`);
        const numeral = new RegExp(`[${numerals.join('')}]`, 'g');
        const getIndex = (d: string) => index.get(d)!;
        return (string: string) => {
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
    decimalPlaceCounter(locale: string) {
        let literal: RegExp | undefined;
        let group: RegExp | undefined;
        let decimal: RegExp | undefined;
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
        return (string: string) => {
            string = string.trim();
            if (literal) string = string.replace(literal, '');
            if (group) string = string.replace(group, '');
            const parts = string.split(decimal || '.');
            return parts && parts[1] && parts[1].length || 0;
        };
    };
}

const _mainLocalizer = new coreLocalizer(); // singleton
const _t = (stringId: string, replacements?: ReplacementsSimple, locale?: string) => _mainLocalizer.t(stringId, replacements, locale);
_t.append = _mainLocalizer.t_append.bind(_mainLocalizer);
_t.addOrUpdate = _mainLocalizer.t_addOrUpdate.bind(_mainLocalizer);

export {
    _mainLocalizer as localizer,
    // export `t` function for ease-of-use
    _t as t
};
