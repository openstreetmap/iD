/* eslint-disable no-console */
/* Downloads the latest translations from Transifex */
const fs = require('fs');
const prettyStringify = require('json-stringify-pretty-compact');
const request = require('request').defaults({ maxSockets: 1 });
const YAML = require('js-yaml');
const colors = require('colors/safe');

const resourceIds = ['core', 'presets', 'imagery', 'community'];
const outdir = 'dist/locales/';
const apiroot = 'https://www.transifex.com/api/2';
const projectURL = `${apiroot}/project/id-editor`;

const languageNames = require('./language_names.js');


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

const languageInfo = languageNames.langNamesInNativeLang;
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

let coverageByLocaleCode = {};

// There's a race condition here, but it's highly unlikely that the info will
// return after the resources. There's an error check just in case.
asyncMap(resourceIds, getResourceInfo, gotResourceInfo);
asyncMap(resourceIds, getResource, gotResource);

function getResourceInfo(resourceId, callback) {
  let url = 'https://api.transifex.com/organizations/openstreetmap/projects/id-editor/resources/' + resourceId;
  request.get(url, { auth : auth }, (err, resp, body) => {
    if (err) return callback(err);
    console.log(`${resp.statusCode}: ${url}`);
    let content = JSON.parse(body);
    callback(null, content);
  });
}
function gotResourceInfo(err, results) {
  if (err) return console.log(err);
  results.forEach(function(info) {
    for (let code in info.stats) {
      let coveragePart = info.stats[code].translated.percentage / results.length;

      code = code.replace(/_/g, '-');
      if (coverageByLocaleCode[code] === undefined) coverageByLocaleCode[code] = 0;
      coverageByLocaleCode[code] += coveragePart;
    }
  });
}

function gotResource(err, results) {
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
    en: { rtl: false, pct: 1 }
  };
  asyncMap(Object.keys(allStrings),
    (code, done) => {
      if (code === 'en') {
        done();
      } else {
        let obj = {};
        obj[code] = allStrings[code] || {};
        obj[code].languageNames = languageNames.languageNamesInLanguageOf(code) || {};
        obj[code].scriptNames = languageNames.scriptNamesInLanguageOf(code) || {};
        fs.writeFileSync(`${outdir}${code}.json`, JSON.stringify(obj));

        getLanguageInfo(code, (err, info) => {
          let rtl = info && info.rtl;
          // exceptions: see #4783
          if (code === 'ckb') {
            rtl = true;
          } else if (code === 'ku') {
            rtl = false;
          }

          let coverage = coverageByLocaleCode[code];
          if (coverage === undefined) {
            console.log('Could not get language coverage');
            process.exit(1);
          }
          // we don't need high precision here, but we need to know if it's exactly 100% or not
          coverage = Math.floor(coverage * 100) / 100;

          dataLocales[code] = {
            rtl: rtl,
            pct: coverage
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
}


function getResource(resourceId, callback) {
  let resourceURL = `${projectURL}/resource/${resourceId}`;
  getLanguages(resourceURL, (err, codes) => {
    if (err) return callback(err);

    asyncMap(codes, getLanguage(resourceURL), (err, results) => {
      if (err) return callback(err);

      let locale = {};
      results.forEach((result, i) => {
        if (resourceId === 'community' && Object.keys(result).length) {
          locale[codes[i]] = { community: result };  // add namespace

        } else {
          if (resourceId === 'presets') {
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
          } else if (resourceId === 'fields') {
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
          } else if (resourceId === 'core') {
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
