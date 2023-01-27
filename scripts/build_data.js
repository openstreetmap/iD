/* eslint-disable no-console */
const chalk = require('chalk');
const fs = require('fs');
const prettyStringify = require('json-stringify-pretty-compact');
const shell = require('shelljs');
const YAML = require('js-yaml');
const fetch = require('node-fetch');
const lodash = require('lodash');

const languageNames = require('./language_names.js');

// fontawesome icons
const fontawesome = require('@fortawesome/fontawesome-svg-core');
const fas = require('@fortawesome/free-solid-svg-icons').fas;
const far = require('@fortawesome/free-regular-svg-icons').far;
const fab = require('@fortawesome/free-brands-svg-icons').fab;
fontawesome.library.add(fas, far, fab);

let _currBuild = null;


// if called directly, do the thing.
if (process.argv[1].indexOf('build_data.js') > -1) {
  buildData();
} else {
  module.exports = buildData;
}


function buildData() {
  if (_currBuild) return _currBuild;

  const START = '🏗   ' + chalk.yellow('Building data...');
  const END = '👍  ' + chalk.green('data built');

  console.log('');
  console.log(START);
  console.time(END);

  // Create symlinks if necessary..  { 'target': 'source' }
  const symlinks = {
    'land.html': 'dist/land.html',
    img: 'dist/img'
  };

  for (let target of Object.keys(symlinks)) {
    if (!shell.test('-L', target)) {
      console.log(`Creating symlink:  ${target} -> ${symlinks[target]}`);
      shell.ln('-sf', symlinks[target], target);
    }
  }

  // Start clean
  shell.rm('-f', [
    'data/territory_languages.json',
    'dist/locales/en.json',
    'dist/data/*',
    'svg/fontawesome/*.svg',
  ]);

  // compile Font Awesome icons
  let faIcons = new Set([
    // list here the icons we want to use in the UI that aren't tied to other data
    'fas-i-cursor',
    'fas-lock',
    'fas-th-list',
    'fas-user-cog',
    'fas-calendar-days',
    'fas-rotate'
  ]);
  // add icons for QA integrations
  readQAIssueIcons(faIcons);

  let territoryLanguages = generateTerritoryLanguages();
  fs.writeFileSync('data/territory_languages.json', prettyStringify(territoryLanguages, { maxLength: 9999 }) );

  writeEnJson();

  const languageInfo = languageNames.langNamesInNativeLang;
  fs.writeFileSync('data/languages.json', prettyStringify(languageInfo, { maxLength: 200 }));
  fs.writeFileSync('dist/data/languages.min.json', JSON.stringify(languageInfo));

  // Save individual data files
  let tasks = [
    minifyJSON('data/address_formats.json', 'dist/data/address_formats.min.json'),
    minifyJSON('data/imagery.json', 'dist/data/imagery.min.json'),
    minifyJSON('data/intro_graph.json', 'dist/data/intro_graph.min.json'),
    minifyJSON('data/keepRight.json', 'dist/data/keepRight.min.json'),
    minifyJSON('data/languages.json', 'dist/data/languages.min.json'),
    minifyJSON('data/phone_formats.json', 'dist/data/phone_formats.min.json'),
    minifyJSON('data/qa_data.json', 'dist/data/qa_data.min.json'),
    minifyJSON('data/shortcuts.json', 'dist/data/shortcuts.min.json'),
    minifyJSON('data/territory_languages.json', 'dist/data/territory_languages.min.json'),
    Promise.all([
      // Fetch the icons that are needed by the expected tagging schema version
      fetch('https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/presets.min.json'),
      fetch('https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/preset_categories.min.json'),
      fetch('https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/fields.min.json'),
      // WARNING: we fetch the bleeding edge data too to make sure we're always hosting the
      // latest icons, but note that the format could break at any time
      fetch('https://raw.githubusercontent.com/openstreetmap/id-tagging-schema/main/dist/presets.min.json'),
      fetch('https://raw.githubusercontent.com/openstreetmap/id-tagging-schema/main/dist/preset_categories.min.json'),
      fetch('https://raw.githubusercontent.com/openstreetmap/id-tagging-schema/main/dist/fields.min.json')
    ])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then((results) => {
      // compile the icons used by all the presets
      results.forEach(function(data) {
        for (var key in data) {
          var datum  = data[key];
          // fontawesome icon
          if (datum.icon && /^fa[srb]-/.test(datum.icon)) {
            faIcons.add(datum.icon);
          }
        }
      });
      // copy over only those Font Awesome icons that we need
      writeFaIcons(faIcons);
    })
  ];

  return _currBuild =
    Promise.all(tasks)
    .then(() => {
      console.timeEnd(END);
      console.log('');
      _currBuild = null;
    })
    .catch((err) => {
      console.error(err);
      console.log('');
      _currBuild = null;
      process.exit(1);
    });
}


function readQAIssueIcons(faIcons) {
  const qa = JSON.parse(fs.readFileSync('data/qa_data.json', 'utf8'));

  for (const service in qa) {
    for (const item in qa[service].icons) {
      const icon = qa[service].icons[item];

      // fontawesome icon, remember for later
      if (/^fa[srb]-/.test(icon)) {
        faIcons.add(icon);
      }
    }
  }
}


function generateTerritoryLanguages() {
  let allRawInfo = require('cldr-core/supplemental/territoryInfo.json').supplemental.territoryInfo;
  let territoryLanguages = {};

  Object.keys(allRawInfo).forEach(territoryCode => {
    let territoryLangInfo = allRawInfo[territoryCode].languagePopulation;
    if (!territoryLangInfo) return;
    let langCodes = Object.keys(territoryLangInfo);

    territoryLanguages[territoryCode.toLowerCase()] = langCodes.sort((langCode1, langCode2) => {
      let popPercent1 = parseFloat(territoryLangInfo[langCode1]._populationPercent);
      let popPercent2 = parseFloat(territoryLangInfo[langCode2]._populationPercent);
      if (popPercent1 === popPercent2) {
        return langCode1.localeCompare(langCode2, 'en', { sensitivity: 'base' });
      }
      return popPercent2 - popPercent1;
    }).map(langCode => langCode.replace('_', '-'));
  });

  // override/adjust some territory languages which are not included in CLDR data
  territoryLanguages.pk.push('pnb', 'scl', 'trw', 'kls'); // https://github.com/openstreetmap/iD/pull/9242
  lodash.pull(territoryLanguages.pk, 'pa-Arab', 'lah', 'tg-Arab'); // - " -
  territoryLanguages.it.push('lld'); // https://en.wikipedia.org/wiki/Ladin_language

  return territoryLanguages;
}


function writeEnJson() {
  const readCoreYaml = fs.readFileSync('data/core.yaml', 'utf8');
  const readImagery = fs.readFileSync('node_modules/editor-layer-index/i18n/en.yaml', 'utf8');
  const readCommunity = fs.readFileSync('node_modules/osm-community-index/i18n/en.yaml', 'utf8');
  const readManualImagery = fs.readFileSync('data/manual_imagery.json', 'utf8');

  return Promise.all([readCoreYaml, readImagery, readCommunity, readManualImagery])
    .then(data => {
      let core = YAML.load(data[0]);
      let imagery = YAML.load(data[1]);
      let community = YAML.load(data[2]);
      let manualImagery = JSON.parse(data[3]);

      for (let i in manualImagery) {
        let layer = manualImagery[i];
        let id = layer.id;
        for (let key in layer) {
          if (key === 'attribution') {
            for (let attrKey in layer[key]) {
              if (attrKey !== 'text') {
                delete layer[key][attrKey];
              }
            }
          } else if (['name', 'description'].indexOf(key) === -1) {
            delete layer[key];
          }
        }
        // tack on strings for additional imagery not included in the index
        imagery.en.imagery[id] = layer;
      }

      let enjson = core;
      let props = ['imagery', 'community', 'languageNames', 'scriptNames'];
      props.forEach(function(prop) {
        if (enjson.en[prop]) {
          console.error(`Error: Reserved property '${prop}' already exists in core strings`);
          process.exit(1);
        }
      });

      enjson.en.imagery = imagery.en.imagery;
      enjson.en.community = community.en;
      enjson.en.languageNames = languageNames.languageNamesInLanguageOf('en');
      enjson.en.scriptNames = languageNames.scriptNamesInLanguageOf('en');

      fs.writeFileSync('dist/locales/en.min.json', JSON.stringify(enjson));
    });
}


function writeFaIcons(faIcons) {
  Array.from(faIcons).forEach(function(key) {
    const prefix = key.substring(0, 3);   // `fas`, `far`, `fab`
    const name = key.substring(4);
    const def = fontawesome.findIconDefinition({ prefix: prefix, iconName: name });
    try {
      fs.writeFileSync(`svg/fontawesome/${key}.svg`, fontawesome.icon(def).html.toString());
    } catch (error) {
      console.error(`Error: No FontAwesome icon for ${key}`);
      throw (error);
    }
  });
}


function minifyJSON(inPath, outPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(inPath, 'utf8', (err, data) => {
      if (err) return reject(err);

      const minified = JSON.stringify(JSON.parse(data));
      fs.writeFile(outPath, minified, (err) => {
        if (err) return reject(err);
        resolve();
      });

    });
  });
}


module.exports = buildData;
