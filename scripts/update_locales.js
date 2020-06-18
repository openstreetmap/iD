/* eslint-disable no-console */
/* Downloads the latest translations from Transifex */
const fs = require('fs');
const prettyStringify = require('json-stringify-pretty-compact');
const request = require('request').defaults({ maxSockets: 1 });
const YAML = require('js-yaml');
const colors = require('colors/safe');

const resources = ['core', 'presets', 'imagery', 'community'];
const outdir = 'dist/locales/';
const apiroot = 'https://www.transifex.com/api/2';
const projectURL = `${apiroot}/project/id-editor`;


// Transifex doesn't allow anonymous downloading
let auth;
/* eslint-disable no-process-env */
if (process.env.transifex_password) {
  // Deployment scripts may prefer environment variables
  auth = {
    user: process.env.transifex_user || 'api',
    password: process.env.transifex_password
  };
} else {
  // Credentials can be stored in transifex.auth as a json object. This file is gitignored.
  // You can use an API key instead of your password: https://docs.transifex.com/api/introduction#authentication
  // {
  //   "user": "username",
  //   "password": "password"
  // }
  auth = JSON.parse(fs.readFileSync('./transifex.auth', 'utf8'));
}
/* eslint-enable no-process-env */
const dataShortcuts = JSON.parse(fs.readFileSync('data/shortcuts.json', 'utf8'));
const cldrMainDir = 'node_modules/cldr-localenames-full/main/';

let referencedScripts = [];

const languageInfo = getLangNamesInNativeLang();
fs.writeFileSync('data/languages.json', prettyStringify(languageInfo, { maxLength: 200 }));
fs.writeFileSync('dist/data/languages.min.json', JSON.stringify(languageInfo));

let shortcuts = [];
dataShortcuts.forEach(tab => {
  tab.columns.forEach(col => {
    col.rows.forEach(row => {
      if (!row.shortcuts) return;
      row.shortcuts.forEach(shortcut => {
        if (shortcut.includes('.')) {
          let info = { shortcut: shortcut };
          if (row.modifiers) {
            info.modifier = row.modifiers.join('');
          }
          shortcuts.push(info);
        }
      });
    });
  });
});

asyncMap(resources, getResource, (err, results) => {
  if (err) return console.log(err);

  // merge in strings fetched from transifex
  let allStrings = {};
  results.forEach(resourceStrings => {
    Object.keys(resourceStrings).forEach(code => {
      if (!allStrings[code]) { allStrings[code] = {}; }
      let source = resourceStrings[code];
      let target = allStrings[code];
      Object.keys(source).forEach(k => target[k] = source[k]);
    });
  });

  // write files and fetch language info for each locale
  let dataLocales = {
    en: { rtl: false, languageNames: languageNamesInLanguageOf('en'), scriptNames: scriptNamesInLanguageOf('en') }
  };
  asyncMap(Object.keys(allStrings),
    (code, done) => {
      if (code === 'en' || !Object.keys(allStrings[code]).length) {
        done();
      } else {
        let obj = {};
        obj[code] = allStrings[code];
        fs.writeFileSync(`${outdir}${code}.json`, JSON.stringify(obj));

        getLanguageInfo(code, (err, info) => {
          let rtl = info && info.rtl;
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
    },
    (err) => {
      if (!err) {
        // list the default locale as explicitly supported
        dataLocales['en-US'] = dataLocales.en;
        const keys = Object.keys(dataLocales).sort();
        let sortedLocales = {};
        keys.forEach(k => sortedLocales[k] = dataLocales[k]);
        fs.writeFileSync('data/locales.json', prettyStringify(sortedLocales, { maxLength: 99999 }));
        fs.writeFileSync('dist/data/locales.min.json', JSON.stringify(sortedLocales));
      }
    }
  );
});


function getResource(resource, callback) {
  let resourceURL = `${projectURL}/resource/${resource}`;
  getLanguages(resourceURL, (err, codes) => {
    if (err) return callback(err);

    asyncMap(codes, getLanguage(resourceURL), (err, results) => {
      if (err) return callback(err);

      let locale = {};
      results.forEach((result, i) => {
        if (resource === 'community' && Object.keys(result).length) {
          locale[codes[i]] = { community: result };  // add namespace

        } else {
          if (resource === 'presets') {
            // remove terms that were not really translated
            let presets = (result.presets && result.presets.presets) || {};
            for (const key of Object.keys(presets)) {
              let preset = presets[key];
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
            let fields = (result.presets && result.presets.fields) || {};
            for (const key of Object.keys(fields)) {
              let field = fields[key];
              if (!field.terms) continue;
              field.terms = field.terms.replace(/\[.*\]/, '').trim();
              if (!field.terms) {
                delete field.terms;
                if (!Object.keys(field).length) {
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
  return (code, callback) => {
    code = code.replace(/-/g, '_');
    let url = `${resourceURL}/translation/${code}`;
    if (code === 'vi') { url += '?mode=reviewed'; }

    request.get(url, { auth : auth }, (err, resp, body) => {
      if (err) return callback(err);
      console.log(`${resp.statusCode}: ${url}`);
      let content = JSON.parse(body).content;
      callback(null, YAML.safeLoad(content)[code]);
    });
  };
}


function getLanguageInfo(code, callback) {
  code = code.replace(/-/g, '_');
  let url = `${apiroot}/language/${code}`;
  request.get(url, { auth : auth }, (err, resp, body) => {
    if (err) return callback(err);
    console.log(`${resp.statusCode}: ${url}`);
    callback(null, JSON.parse(body));
  });
}


function getLanguages(resourceURL, callback) {
  let url = `${resourceURL}?details`;
  request.get(url, { auth: auth }, (err, resp, body) => {
    if (err) return callback(err);
    console.log(`${resp.statusCode}: ${url}`);
    callback(null, JSON.parse(body).available_languages
      .map(d => d.code.replace(/_/g, '-'))
      .filter(d => d !== 'en')
    );
  });
}


function asyncMap(inputs, func, callback) {
  let index = 0;
  let remaining = inputs.length;
  let results = [];
  let error;

  next();

  function next() {
    callFunc(index++);
    if (index < inputs.length) {
      setTimeout(next, 200);
    }
  }

  function callFunc(i) {
    let d = inputs[i];
    func(d, (err, data) => {
      if (err) error = err;
      results[i] = data;
      remaining--;
      if (!remaining) callback(error, results);
    });
  }
}


function checkForDuplicateShortcuts(code, coreStrings) {
  let usedShortcuts = {};

  shortcuts.forEach(shortcutInfo => {
    let shortcutPathString = shortcutInfo.shortcut;
    let modifier = shortcutInfo.modifier || '';

    let path = shortcutPathString
      .split('.')
      .map(s => s.replace(/<TX_DOT>/g, '.'))
      .reverse();

    let rep = coreStrings;

    while (rep !== undefined && path.length) {
      rep = rep[path.pop()];
    }

    if (rep !== undefined) {
      let shortcut = modifier + rep;
      if (usedShortcuts[shortcut] && usedShortcuts[shortcut] !== shortcutPathString) {
        let message = code + ': duplicate shortcut "' + shortcut + '" for "' + usedShortcuts[shortcut] + '" and "' + shortcutPathString + '"';
        console.warn(colors.yellow(message));
      } else {
        usedShortcuts[shortcut] = shortcutPathString;
      }
    }
  });
}

function getLangNamesInNativeLang() {
  // manually add languages we want that aren't in CLDR
  let unordered = {
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

  let langDirectoryPaths = fs.readdirSync(cldrMainDir);
  langDirectoryPaths.forEach(code => {
    let languagesPath = `${cldrMainDir}${code}/languages.json`;
    //if (!fs.existsSync(languagesPath)) return;
    let languageObj = JSON.parse(fs.readFileSync(languagesPath, 'utf8')).main[code];
    let identity = languageObj.identity;

    // skip locale-specific languages
    if (identity.letiant || identity.territory) return;

    let info = {};
    const script = identity.script;
    if (script) {
      referencedScripts.push(script);
      info.base = identity.language;
      info.script = script;
    }

    const nativeName = languageObj.localeDisplayNames.languages[code];
    if (nativeName) {
      info.nativeName = nativeName;
    }

    unordered[code] = info;
  });

  let ordered = {};
  Object.keys(unordered).sort().forEach(key => ordered[key] = unordered[key]);
  return ordered;
}


const rematchCodes = { 'ar-AA': 'ar', 'zh-CN': 'zh', 'zh-HK': 'zh-Hant-HK', 'zh-TW': 'zh-Hant', 'pt-BR': 'pt', 'pt': 'pt-PT' };

function languageNamesInLanguageOf(code) {
  if (rematchCodes[code]) code = rematchCodes[code];

  let languageFilePath = `${cldrMainDir}${code}/languages.json`;
  if (!fs.existsSync(languageFilePath)) return null;

  let translatedLangsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.languages;

  // ignore codes for non-languages
  for (let nonLangCode in { mis: true, mul: true, und: true, zxx: true }) {
    delete translatedLangsByCode[nonLangCode];
  }

  for (let langCode in translatedLangsByCode) {
    let altLongIndex = langCode.indexOf('-alt-long');
    if (altLongIndex !== -1) {    // prefer long names (e.g. Chinese -> Mandarin Chinese)
      let base = langCode.substring(0, altLongIndex);
      translatedLangsByCode[base] = translatedLangsByCode[langCode];
    }

    if (langCode.includes('-alt-')) {    // remove alternative names
      delete translatedLangsByCode[langCode];
    } else if (langCode === translatedLangsByCode[langCode]) {   // no localized value available
      delete translatedLangsByCode[langCode];
    }
  }

  return translatedLangsByCode;
}


function scriptNamesInLanguageOf(code) {
  if (rematchCodes[code]) code = rematchCodes[code];

  let languageFilePath = `${cldrMainDir}${code}/scripts.json`;
  if (!fs.existsSync(languageFilePath)) return null;

  let allTranslatedScriptsByCode = JSON.parse(fs.readFileSync(languageFilePath, 'utf8')).main[code].localeDisplayNames.scripts;

  let translatedScripts = {};
  referencedScripts.forEach(script => {
    if (!allTranslatedScriptsByCode[script] || script === allTranslatedScriptsByCode[script]) return;
    translatedScripts[script] = allTranslatedScriptsByCode[script];
  });

  return translatedScripts;
}
