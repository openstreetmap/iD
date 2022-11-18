/* eslint-disable no-console */
/* Downloads the latest translations from Transifex */
const chalk = require('chalk');
const fs = require('fs');
const fetch = require('node-fetch');
const YAML = require('js-yaml');
const transifexApi = require('@transifex/api').transifexApi;

const resourceIds = ['core', 'imagery', 'community'];
const reviewedOnlyLangs = ['vi'];
const outdir = 'dist/locales/';

const languageNames = require('./language_names.js');

const transifexOrganization = 'openstreetmap';
const transifexProject = 'id-editor';

// Transifex doesn't allow anonymous downloading
/* eslint-disable no-process-env */
if (process.env.transifex_password) {
  // Deployment scripts may prefer environment variables
  transifexApi.setup({ auth: process.env.transifex_password });
} else {
  // Credentials can be stored in transifex.auth as a json object. This file is gitignored.
  // You must use an API token for authentication: You can generate one at https://www.transifex.com/user/settings/api/.
  // {
  //   "password": "<api_key>"
  // }
  transifexApi.setup({ auth: JSON.parse(fs.readFileSync('./transifex.auth', 'utf8')).password });
}
/* eslint-enable no-process-env */

const dataShortcuts = JSON.parse(fs.readFileSync('data/shortcuts.json', 'utf8'));

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

async function getResourceInfo(resourceId, callback) {
  try {
    const result = [];
    for await (const stat of transifexApi.ResourceLanguageStats.filter({
      project: `o:${transifexOrganization}:p:${transifexProject}`,
      resource: `o:${transifexOrganization}:p:${transifexProject}:r:${resourceId}`
    }).all()) {
      result.push(stat);
    }
    console.log(`got resource language stats collection for ${resourceId}`);
    callback(null, result);
  } catch (err) {
    console.error(`error while getting resource language stats collection for ${resourceId}`);
    callback(err);
  }
}
function gotResourceInfo(err, results) {
  if (err) return console.log(err);
  results.forEach(info => {
    info.forEach(stat => {
      let code = stat.relationships.language.data.id.substr(2).replace(/_/g, '-');
      let type = 'translated_strings';
      if (reviewedOnlyLangs.indexOf(code) !== -1) {
        type = 'reviewed_strings';
      }
      let coveragePart = (stat.attributes[type] /  stat.attributes.total_strings) / results.length;

      if (coverageByLocaleCode[code] === undefined) coverageByLocaleCode[code] = 0;
      coverageByLocaleCode[code] += coveragePart;
    });
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
        let lNames = languageNames.languageNamesInLanguageOf(code) || {};
        if (Object.keys(lNames).length) {
          obj[code].languageNames = lNames;
        }
        let sNames = languageNames.scriptNamesInLanguageOf(code) || {};
        if (Object.keys(sNames).length) {
          obj[code].scriptNames = sNames;
        }
        fs.writeFileSync(`${outdir}${code}.min.json`, JSON.stringify(obj));

        getLanguageInfo(code, (err, info) => {
          if (err) return console.log(err);

          let rtl = info && info.attributes && info.attributes.rtl;
          // exceptions: see #4783
          if (code === 'ckb') {
            rtl = true;
          } else if (code === 'ku') {
            rtl = false;
          }

          let coverage = coverageByLocaleCode[code];
          if (coverage === undefined) {
            console.log(`Could not get language coverage for ${code}`, coverageByLocaleCode);
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
        fs.writeFileSync('dist/locales/index.min.json', JSON.stringify(sortedLocales));
      }
    }
  );
}


function getResource(resourceId, callback) {
  getLanguages((err, codes) => {
    if (err) return callback(err);

    asyncMap(codes, getLanguage(resourceId), (err, results) => {
      if (err) return callback(err);

      let locale = {};
      results.forEach((result, i) => {
        if (resourceId === 'community' && Object.keys(result).length) {
          locale[codes[i]] = { community: result };  // add namespace

        } else {
          if (resourceId === 'core') {
            checkForDuplicateShortcuts(codes[i], result);
          }

          locale[codes[i]] = result;
        }
      });

      callback(null, locale);
    });
  });
}


function getLanguage(resourceId) {
  return async (code, callback) => {
    try {
      code = code.replace(/-/g, '_');
      const url = await transifexApi.ResourceTranslationsAsyncDownload.download({
        resource: {data:{type:'resources', id:`o:${transifexOrganization}:p:${transifexProject}:r:${resourceId}`}},
        language: {data:{type:'languages', id:`l:${code}`}},
        // fetch only reviewed strings for some languages
        mode: reviewedOnlyLangs.indexOf(code) !== -1 ? 'reviewed' : 'default'
      });
      const data = await fetch(url).then(d => d.text());
      console.log(`got translations for ${resourceId}, language ${code}`);
      callback(null, YAML.load(data)[code]);
    } catch (err) {
      console.error(`error while getting translations for ${resourceId}, language ${code}`, err);
      callback(err);
    }
  };
}


async function getLanguageInfo(code, callback) {
  code = code.replace(/-/g, '_');
  try {
    const lng = await transifexApi.Language.get({
      code: code
    });
    console.log(`got language details for ${code}`);
    callback(null, lng);
  } catch (err) {
    console.error(`error while getting language details for ${code}`);
    callback(err);
  }
}


async function getLanguages(callback) {
  try {
    const result = [];
    const project = await transifexApi.Project.get({
      organization: `o:${transifexOrganization}`,
      slug: transifexProject
    });
    const lngs = await project.fetch('languages');
    for await (const lng of lngs.all()) {
      if (lng.attributes.code === 'en') continue;
      result.push(lng.attributes.code.replace(/_/g, '-'));
    }
    console.log('got project languages');
    callback(null, result);
  } catch (err) {
    console.error('error while getting project languages');
    callback(err);
  }
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
      setTimeout(next, 50);
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
        console.warn(chalk.yellow(message));
      } else {
        usedShortcuts[shortcut] = shortcutPathString;
      }
    }
  });
}
