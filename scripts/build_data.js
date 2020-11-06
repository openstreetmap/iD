/* eslint-disable no-console */
const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');
const prettyStringify = require('json-stringify-pretty-compact');
const shell = require('shelljs');
const YAML = require('js-yaml');

const languageNames = require('./language_names.js');

const presets = require('@openstreetmap/id-tagging-schema/dist/presets.min.json');
const fields = require('@openstreetmap/id-tagging-schema/dist/fields.min.json');
const categories = require('@openstreetmap/id-tagging-schema/dist/preset_categories.min.json');
const defaults = require('@openstreetmap/id-tagging-schema/dist/preset_defaults.min.json');
const discarded = require('@openstreetmap/id-tagging-schema/dist/discarded.min.json');
const deprecated = require('@openstreetmap/id-tagging-schema/dist/deprecated.min.json');
const taginfo = require('@openstreetmap/id-tagging-schema/dist/taginfo.min.json');

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

  const START = '🏗   ' + colors.yellow('Building data...');
  const END = '👍  ' + colors.green('data built');

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
    'data/presets.yaml',
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
    'fas-user-cog'
  ]);
  // add icons for QA integrations
  readQAIssueIcons(faIcons);
  // add icons for presets
  [categories, fields, presets].forEach(function(data) {
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

  let territoryLanguages = generateTerritoryLanguages();
  fs.writeFileSync('data/territory_languages.json', prettyStringify(territoryLanguages, { maxLength: 9999 }) );
  writeEnJson();

  // put preset translations file where Transifex currently expects it
  fs.copyFileSync(path.dirname(require.resolve('@openstreetmap/id-tagging-schema')) + '/dist/translations/en.yaml', 'data/presets.yaml');

  fs.writeFileSync('dist/data/preset_presets.min.json', JSON.stringify(presets));
  fs.writeFileSync('dist/data/preset_fields.min.json', JSON.stringify(fields));
  fs.writeFileSync('dist/data/preset_categories.min.json', JSON.stringify(categories));
  fs.writeFileSync('dist/data/preset_defaults.min.json', JSON.stringify(defaults));
  fs.writeFileSync('dist/data/discarded.min.json', JSON.stringify(discarded));
  fs.writeFileSync('dist/data/deprecated.min.json', JSON.stringify(deprecated));
  fs.writeFileSync('dist/data/taginfo.min.json', JSON.stringify(taginfo));

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
    minifyJSON('data/locales.json', 'dist/data/locales.min.json'),
    minifyJSON('data/phone_formats.json', 'dist/data/phone_formats.min.json'),
    minifyJSON('data/qa_data.json', 'dist/data/qa_data.min.json'),
    minifyJSON('data/shortcuts.json', 'dist/data/shortcuts.min.json'),
    minifyJSON('data/territory_languages.json', 'dist/data/territory_languages.min.json')
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

  return territoryLanguages;
}


function writeEnJson() {
  const schemaTranslations = require('@openstreetmap/id-tagging-schema/dist/translations/en.json').en;
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
      let props = Object.keys(schemaTranslations).concat(['imagery', 'community', 'languageNames', 'scriptNames']);
      props.forEach(function(prop) {
        if (enjson.en[prop]) {
          console.error(`Error: Reserved property '${prop}' already exists in core strings`);
          process.exit(1);
        }
      });

      for (var key in schemaTranslations) {
        enjson.en[key] = schemaTranslations[key];
      }

      enjson.en.imagery = imagery.en.imagery;
      enjson.en.community = community.en;
      enjson.en.languageNames = languageNames.languageNamesInLanguageOf('en');
      enjson.en.scriptNames = languageNames.scriptNamesInLanguageOf('en');

      return fs.writeFileSync('dist/locales/en.json', JSON.stringify(enjson, null, 4));
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
