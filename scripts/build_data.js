/* eslint-disable no-console */
const colors = require('colors/safe');
const fs = require('fs');
const glob = require('glob');
const jsonschema = require('jsonschema');
const nsiBrands = require('name-suggestion-index/dist/brands.json').brands;
const nsiWikidata = require('name-suggestion-index/dist/wikidata.json').wikidata;
const path = require('path');
const prettyStringify = require('json-stringify-pretty-compact');
const shell = require('shelljs');
const YAML = require('js-yaml');

const fieldSchema = require('../data/presets/schema/field.json');
const presetSchema = require('../data/presets/schema/preset.json');
const deprecated = require('../data/deprecated.json');

// fontawesome icons
const fontawesome = require('@fortawesome/fontawesome-svg-core');
const fas = require('@fortawesome/free-solid-svg-icons').fas;
const far = require('@fortawesome/free-regular-svg-icons').far;
const fab = require('@fortawesome/free-brands-svg-icons').fab;
fontawesome.library.add(fas, far, fab);

const request = require('request').defaults({ maxSockets: 1 });

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

  // Translation strings
  let tstrings = {
    categories: {},
    fields: {},
    presets: {}
  };

  // Font Awesome icons used
  let faIcons = {
    'fas-i-cursor': {},
    'fas-lock': {},
    'fas-th-list': {},
    'fas-user-cog': {}
  };

  // The Noun Project icons used
  let tnpIcons = {};

  // all fields searchable under "add field"
  let searchableFieldIDs = {};

  // Start clean
  shell.rm('-f', [
    'data/presets/categories.json',
    'data/presets/fields.json',
    'data/presets/presets.json',
    'data/presets.yaml',
    'data/taginfo.json',
    'data/territory_languages.json',
    'dist/locales/en.json',
    'dist/data/*',
    'svg/fontawesome/*.svg',
  ]);

  readQAIssueIcons(faIcons, tnpIcons);
  let categories = generateCategories(tstrings, faIcons, tnpIcons);
  let fields = generateFields(tstrings, faIcons, tnpIcons, searchableFieldIDs);
  let presets = generatePresets(tstrings, faIcons, tnpIcons, searchableFieldIDs);
  let defaults = read('data/presets/defaults.json');
  let translations = generateTranslations(fields, presets, tstrings, searchableFieldIDs);
  let taginfo = generateTaginfo(presets, fields);
  let territoryLanguages = generateTerritoryLanguages();

  // Additional consistency checks
  validateCategoryPresets(categories, presets);
  validatePresetFields(presets, fields);
  validateDefaults(defaults, categories, presets);

  fs.writeFileSync('data/presets/categories.json', prettyStringify(categories, { maxLength: 9999 }) );
  fs.writeFileSync('data/presets/fields.json', prettyStringify(fields, { maxLength: 9999 }) );
  fs.writeFileSync('data/presets/presets.json', prettyStringify(presets, { maxLength: 9999 }) );
  fs.writeFileSync('data/presets.yaml', translationsToYAML(translations) );
  fs.writeFileSync('data/taginfo.json', prettyStringify(taginfo, { maxLength: 9999 }) );
  fs.writeFileSync('data/territory_languages.json', prettyStringify(territoryLanguages, { maxLength: 9999 }) );
  writeEnJson(tstrings);
  writeFaIcons(faIcons);
  writeTnpIcons(tnpIcons);

  // Save individual data files
  let tasks = [
    minifyJSON('data/presets/categories.json', 'dist/data/preset_categories.min.json'),
    minifyJSON('data/presets/defaults.json', 'dist/data/preset_defaults.min.json'),
    minifyJSON('data/presets/fields.json', 'dist/data/preset_fields.min.json'),
    minifyJSON('data/presets/presets.json', 'dist/data/preset_presets.min.json'),
    minifyJSON('data/address_formats.json', 'dist/data/address_formats.min.json'),
    minifyJSON('data/deprecated.json', 'dist/data/deprecated.min.json'),
    minifyJSON('data/discarded.json', 'dist/data/discarded.min.json'),
    minifyJSON('data/imagery.json', 'dist/data/imagery.min.json'),
    minifyJSON('data/intro_graph.json', 'dist/data/intro_graph.min.json'),
    minifyJSON('data/keepRight.json', 'dist/data/keepRight.min.json'),
    minifyJSON('data/languages.json', 'dist/data/languages.min.json'),
    minifyJSON('data/locales.json', 'dist/data/locales.min.json'),
    minifyJSON('data/phone_formats.json', 'dist/data/phone_formats.min.json'),
    minifyJSON('data/qa_data.json', 'dist/data/qa_data.min.json'),
    minifyJSON('data/shortcuts.json', 'dist/data/shortcuts.min.json'),
    minifyJSON('data/taginfo.json', 'dist/data/taginfo.min.json'),
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


function read(f) {
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}


function validate(file, instance, schema) {
  let validationErrors = jsonschema.validate(instance, schema).errors;

  if (validationErrors.length) {
    console.error(`${file}: `);
    validationErrors.forEach(error => {
      if (error.property) {
        console.error(error.property + ' ' + error.message);
      } else {
        console.error(error);
      }
    });
    console.log('');
    process.exit(1);
  }
}


function readQAIssueIcons(faIcons, tnpIcons) {
  const qa = read('data/qa_data.json');

  for (const service in qa) {
    for (const item in qa[service].icons) {
      const icon = qa[service].icons[item];

      // fontawesome icon, remember for later
      if (/^fa[srb]-/.test(icon)) {
        faIcons[icon] = {};
      }
      // noun project icon, remember for later
      if (/^tnp-/.test(icon)) {
        tnpIcons[icon] = {};
      }
    }
  }
}


function generateCategories(tstrings, faIcons, tnpIcons) {
  let categories = {};

  glob.sync('data/presets/categories/*.json').forEach(file => {
    let category = read(file);
    let id = 'category-' + path.basename(file, '.json');
    tstrings.categories[id] = { name: category.name };
    categories[id] = category;

    // fontawesome icon, remember for later
    if (/^fa[srb]-/.test(category.icon)) {
      faIcons[category.icon] = {};
    }
    // noun project icon, remember for later
    if (/^tnp-/.test(category.icon)) {
      tnpIcons[category.icon] = {};
    }
  });

  return categories;
}


function generateFields(tstrings, faIcons, tnpIcons, searchableFieldIDs) {
  let fields = {};

  glob.sync('data/presets/fields/**/*.json').forEach(file => {
    let field = read(file);
    let id = stripLeadingUnderscores(file.match(/presets\/fields\/([^.]*)\.json/)[1]);

    validate(file, field, fieldSchema);

    let t = tstrings.fields[id] = {
      label: field.label,
      terms: (field.terms || []).join(',')
    };

    if (field.universal) {
      searchableFieldIDs[id] = true;
    }

    if (field.placeholder) {
      t.placeholder = field.placeholder;
    }

    if (field.strings) {
      for (let i in field.strings) {
        t[i] = field.strings[i];
      }
    }

    fields[id] = field;

    // fontawesome icon, remember for later
    if (/^fa[srb]-/.test(field.icon)) {
      faIcons[field.icon] = {};
    }
    // noun project icon, remember for later
    if (/^tnp-/.test(field.icon)) {
      tnpIcons[field.icon] = {};
    }
  });

  return fields;
}


function suggestionsToPresets(presets) {
  Object.keys(nsiBrands).forEach(kvnd => {
    const suggestion = nsiBrands[kvnd];
    const qid = suggestion.tags['brand:wikidata'];
    if (!qid || !/^Q\d+$/.test(qid)) return;   // wikidata tag missing or looks wrong..

    const parts = kvnd.split('|', 2);
    const kv = parts[0];
    const name = parts[1].replace('~', ' ');

    let presetID, preset;

    // sometimes we can choose a more specific preset then key/value..
    if (suggestion.tags.cuisine) {
      // cuisine can contain multiple values, so try them all in order
      let cuisines = suggestion.tags.cuisine.split(';');
      for (let i = 0; i < cuisines.length; i++) {
        presetID = kv + '/' + cuisines[i].trim();
        preset = presets[presetID];
        if (preset) break;  // we matched one
      }

    } else if (suggestion.tags.vending) {
      if (suggestion.tags.vending === 'parcel_pickup;parcel_mail_in') {
        presetID = kv + '/parcel_pickup_dropoff';
      } else {
        presetID = kv + '/' + suggestion.tags.vending;
      }
      preset = presets[presetID];
    }

    // A few exceptions where the NSI tagging doesn't exactly match iD tagging..
    if (kv === 'healthcare/clinic') {
      presetID = 'amenity/clinic';
      preset = presets[presetID];
    } else if (kv === 'leisure/tanning_salon') {
      presetID = 'shop/beauty/tanning';
      preset = presets[presetID];
    }

    // fallback to key/value
    if (!preset) {
      presetID = kv;
      preset = presets[presetID];
    }

    // still no match?
    if (!preset) {
      console.log(`Warning:  No preset "${presetID}" for name-suggestion "${name}"`);
      return;
    }

    let suggestionID = presetID + '/' + name.replace('/', '');

    let tags = { 'brand:wikidata': qid };
    for (let k in preset.tags) {
      // prioritize suggestion tags over preset tags (for `vending`,`cuisine`, etc)
      tags[k] = suggestion.tags[k] || preset.tags[k];
    }

    // Prefer a wiki commons logo sometimes.. #6361
    const preferCommons = {
      Q177054: true,    // Burger King
      Q524757: true,    // KFC
      Q779845: true,    // CBA
      Q1205312: true,   // In-N-Out
      Q10443115: true   // Carlings
    };

    let logoURL;
    let logoURLs = nsiWikidata[qid] && nsiWikidata[qid].logos;
    if (logoURLs) {
      if (logoURLs.wikidata && preferCommons[qid]) {
        logoURL = logoURLs.wikidata;
      } else if (logoURLs.facebook) {
        logoURL = logoURLs.facebook;
      } else if (logoURLs.twitter) {
        logoURL = logoURLs.twitter;
      } else {
        logoURL = logoURLs.wikidata;
      }
    }

    presets[suggestionID] = {
      name: name,
      icon: preset.icon,
      imageURL: logoURL,
      geometry: preset.geometry,
      tags: tags,
      addTags: suggestion.tags,
      reference: preset.reference,
      countryCodes: suggestion.countryCodes,
      terms: (suggestion.matchNames || []),
      matchScore: 2,
      suggestion: true
    };
  });

  return presets;
}


function stripLeadingUnderscores(str) {
  return str.split('/')
    .map(s => s.replace(/^_/,''))
    .join('/');
}


function generatePresets(tstrings, faIcons, tnpIcons, searchableFieldIDs) {
  let presets = {};

  glob.sync('data/presets/presets/**/*.json').forEach(file => {
    let preset = read(file);
    let id = stripLeadingUnderscores(file.match(/presets\/presets\/([^.]*)\.json/)[1]);

    validate(file, preset, presetSchema);

    tstrings.presets[id] = {
      name: preset.name,
      terms: (preset.terms || []).join(',')
    };

    if (preset.moreFields) {
      preset.moreFields.forEach(fieldID => { searchableFieldIDs[fieldID] = true; });
    }

    presets[id] = preset;

    // fontawesome icon, remember for later
    if (/^fa[srb]-/.test(preset.icon)) {
      faIcons[preset.icon] = {};
    }
    // noun project icon, remember for later
    if (/^tnp-/.test(preset.icon)) {
      tnpIcons[preset.icon] = {};
    }
  });

  presets = Object.assign(presets, suggestionsToPresets(presets));
  return presets;
}


function generateTranslations(fields, presets, tstrings, searchableFieldIDs) {
  let translations = JSON.parse(JSON.stringify(tstrings));  // deep clone

  Object.keys(translations.fields).forEach(id => {
    let field = translations.fields[id];
    let f = fields[id];
    let options = field.options || {};
    let optkeys = Object.keys(options);

    if (f.keys) {
      field['label#'] = f.keys.map(k => `${k}=*`).join(', ');
      optkeys.forEach(k => {
        if (id === 'access') {
          options[k]['title#'] = options[k]['description#'] = `access=${k}`;
        } else {
          options[k + '#'] = `${k}=yes`;
        }
      });
    } else if (f.key) {
      field['label#'] = `${f.key}=*`;
      optkeys.forEach(k => {
        options[k + '#'] = `${f.key}=${k}`;
      });
    }

    if (f.placeholder) {
      field['placeholder#'] = `${id} field placeholder`;
    }

    if (searchableFieldIDs[id]) {
      if (f.terms && f.terms.length) {
        field['terms#'] = 'terms: ' + f.terms.join();
      }
      field.terms = '[translate with synonyms or related terms for \'' + field.label + '\', separated by commas]';
    } else {
      delete tstrings.fields[id].terms;
      delete f.terms;
      delete field.terms;
    }
  });

  Object.keys(translations.presets).forEach(id => {
    let preset = translations.presets[id];
    let p = presets[id];
    let tags = p.tags || {};
    let keys = Object.keys(tags);

    if (keys.length) {
      preset['name#'] = keys.map(k => `${k}=${tags[k]}`).join(', ');
    }

    if (p.searchable !== false) {
      if (p.terms && p.terms.length) {
        preset['terms#'] = 'terms: ' + p.terms.join();
      }
      preset.terms = `<translate with synonyms or related terms for '${preset.name}', separated by commas>`;
    } else {
      delete tstrings.presets[id].terms;
      delete p.terms;
      delete preset.terms;
    }
  });

  return translations;
}


function generateTaginfo(presets, fields) {
  let taginfo = {
    'data_format': 1,
    'data_url': 'https://raw.githubusercontent.com/openstreetmap/iD/develop/data/taginfo.json',
    'project': {
      'name': 'iD Editor',
      'description': 'Online editor for OSM data.',
      'project_url': 'https://github.com/openstreetmap/iD',
      'doc_url': 'https://github.com/openstreetmap/iD/blob/develop/data/presets/README.md',
      'icon_url': 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@release/dist/img/logo.png',
      'contact_name': 'Quincy Morgan',
      'contact_email': 'q@quincylvania.com'
    },
    'tags': []
  };

  Object.keys(presets).forEach(id => {
    let preset = presets[id];
    if (preset.suggestion) return;

    let keys = Object.keys(preset.tags);
    let last = keys[keys.length - 1];
    let tag = { key: last };

    if (!last) return;

    if (preset.tags[last] !== '*') {
      tag.value = preset.tags[last];
    }
    if (preset.name) {
      let legacy = (preset.searchable === false) ? ' (unsearchable)' : '';
      tag.description = [ `🄿 ${preset.name}${legacy}` ];
    }
    if (preset.geometry) {
      setObjectType(tag, preset);
    }

    // add icon
    if (/^maki-/.test(preset.icon)) {
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/mapbox/maki/icons/' +
        preset.icon.replace(/^maki-/, '') + '-15.svg';
    } else if (/^temaki-/.test(preset.icon)) {
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/ideditor/temaki/icons/' +
        preset.icon.replace(/^temaki-/, '') + '.svg';
    } else if (/^fa[srb]-/.test(preset.icon)) {
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@develop/svg/fontawesome/' +
        preset.icon + '.svg';
    } else if (/^iD-/.test(preset.icon)) {
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@develop/svg/iD-sprite/presets/' +
        preset.icon.replace(/^iD-/, '') + '.svg';
    } else if (/^tnp-/.test(preset.icon)) {
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@develop/svg/the-noun-project/' +
        preset.icon.replace(/^tnp-/, '') + '.svg';
    }

    coalesceTags(taginfo, tag);
  });

  Object.keys(fields).forEach(id => {
    const field = fields[id];
    const keys = field.keys || [ field.key ] || [];
    const isRadio = (field.type === 'radio' || field.type === 'structureRadio');

    keys.forEach(key => {
      if (field.strings && field.strings.options && !isRadio) {
        let values = Object.keys(field.strings.options);
        values.forEach(value => {
          if (value === 'undefined' || value === '*' || value === '') return;
          let tag = { key: key, value: value };
          if (field.label) {
            tag.description = [ `🄵 ${field.label}` ];
          }
          coalesceTags(taginfo, tag);
        });
      } else {
        let tag = { key: key };
        if (field.label) {
          tag.description = [ `🄵 ${field.label}` ];
        }
        coalesceTags(taginfo, tag);
      }
    });
  });

  deprecated.forEach(elem => {
    let old = elem.old;
    let oldKeys = Object.keys(old);
    if (oldKeys.length === 1) {
      let oldKey = oldKeys[0];
      let tag = { key: oldKey };

      let oldValue = old[oldKey];
      if (oldValue !== '*') tag.value = oldValue;
      let replacementStrings = [];
      for (let replaceKey in elem.replace) {
        let replaceValue = elem.replace[replaceKey];
        if (replaceValue === '$1') replaceValue = '*';
        replacementStrings.push(`${replaceKey}=${replaceValue}`);
      }
      let description = '🄳';
      if (replacementStrings.length > 0) {
        description += ' ➜ ' + replacementStrings.join(' + ');
      }
      tag.description = [description];
      coalesceTags(taginfo, tag);
    }
  });

  taginfo.tags.forEach(elem => {
    if (elem.description) {
      elem.description = elem.description.join(', ');
    }
  });


  function coalesceTags(taginfo, tag) {
    if (!tag.key) return;

    let currentTaginfoEntries = taginfo.tags
      .filter(t => (t.key === tag.key && t.value === tag.value));

    if (currentTaginfoEntries.length === 0) {
      taginfo.tags.push(tag);
      return;
    }

    if (!tag.description) return;

    if (!currentTaginfoEntries[0].description) {
      currentTaginfoEntries[0].description = tag.description;
      return;
    }

    let isNewDescription = currentTaginfoEntries[0].description
      .indexOf(tag.description[0]) === -1;

    if (isNewDescription) {
      currentTaginfoEntries[0].description.push(tag.description[0]);
    }
  }


  function setObjectType(tag, input) {
    tag.object_types = [];
    const mapping = {
      'point'    : 'node',
      'vertex'   : 'node',
      'line'     : 'way',
      'relation' : 'relation',
      'area'     : 'area'
    };

    input.geometry.forEach(geom => {
      if (tag.object_types.indexOf(mapping[geom]) === -1) {
        tag.object_types.push(mapping[geom]);
      }
    });
  }

  return taginfo;
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


function validateCategoryPresets(categories, presets) {
  Object.keys(categories).forEach(id => {
    const category = categories[id];
    if (!category.members) return;
    category.members.forEach(preset => {
      if (presets[preset] === undefined) {
        console.error('Unknown preset: ' + preset + ' in category ' + category.name);
        console.log('');
        process.exit(1);
      }
    });
  });
}

function validatePresetFields(presets, fields) {
  const betweenBracketsRegex = /([^{]*?)(?=\})/;
  const maxFieldsBeforeError = 12;
  const maxFieldsBeforeWarning = 8;

  for (let presetID in presets) {
    let preset = presets[presetID];

    if (preset.replacement) {
      let replacementPreset = presets[preset.replacement];
      let p1geometry = preset.geometry.slice().sort.toString();
      let p2geometry = replacementPreset.geometry.slice().sort.toString();
      if (replacementPreset === undefined) {
        console.error('Unknown preset "' + preset.replacement + '" referenced as replacement of preset "' + presetID + '" (' + preset.name + ')');
        console.log('');
        process.exit(1);
      } else if (p1geometry !== p2geometry) {
        console.error('The preset "' + presetID + '" has different geometry than its replacement preset, "' + preset.replacement + '". They must match for tag upgrades to work.');
        console.log('');
        process.exit(1);
      }
    }

    // the keys for properties that contain arrays of field ids
    let fieldKeys = ['fields', 'moreFields'];
    for (let fieldsKeyIndex in fieldKeys) {
      let fieldsKey = fieldKeys[fieldsKeyIndex];
      if (!preset[fieldsKey]) continue; // no fields are referenced, okay

      for (let fieldIndex in preset[fieldsKey]) {
        let field = preset[fieldsKey][fieldIndex];
        if (fields[field] !== undefined) continue; // field found, okay

        let regexResult = betweenBracketsRegex.exec(field);
        if (regexResult) {
          let foreignPresetID = regexResult[0];
          if (presets[foreignPresetID] === undefined) {
            console.error('Unknown preset "' + foreignPresetID + '" referenced in "' + fieldsKey + '" array of preset "' + presetID + '" (' + preset.name + ')');
            console.log('');
            process.exit(1);
          }
        } else {
          console.error('Unknown preset field "' + field + '" in "' + fieldsKey + '" array of preset "' + presetID + '" (' + preset.name + ')');
          console.log('');
          process.exit(1);
        }
      }
    }

    if (preset.fields) {
      // since `moreFields` is available, check that `fields` doesn't get too cluttered
      let fieldCount = preset.fields.length;

      if (fieldCount > maxFieldsBeforeWarning) {
        // Fields with `prerequisiteTag` probably won't show up initially,
        // so don't count them against the limits.
        const fieldsWithoutPrerequisites = preset.fields.filter(fieldID => {
          if (fields[fieldID] && fields[fieldID].prerequisiteTag) return false;
          return true;
        });
        fieldCount = fieldsWithoutPrerequisites.length;
      }
      if (fieldCount > maxFieldsBeforeError) {
        console.error(fieldCount + ' values in "fields" of "' + preset.name + '" (' + presetID + '). Limit: ' + maxFieldsBeforeError + '. Please move lower-priority fields to "moreFields".');
        console.log('');
        process.exit(1);
      }
      else if (fieldCount > maxFieldsBeforeWarning) {
        console.log('Warning: ' + fieldCount + ' values in "fields" of "' + preset.name + '" (' + presetID + '). Recommended: ' + maxFieldsBeforeWarning + ' or fewer. Consider moving lower-priority fields to "moreFields".');
      }
    }
  }
}

function validateDefaults(defaults, categories, presets) {
  Object.keys(defaults).forEach(name => {
    const members = defaults[name];
    members.forEach(id => {
      if (!presets[id] && !categories[id]) {
        console.error(`Unknown category or preset: ${id} in default ${name}`);
        console.log('');
        process.exit(1);
      }
    });
  });
}

function translationsToYAML(translations) {
  // comment keys end with '#' and should sort immediately before their related key.
  function commentFirst(a, b) {
    return (a === b + '#') ? -1
      : (b === a + '#') ? 1
      : (a > b ? 1 : a < b ? -1 : 0);
  }

  return YAML.safeDump({ en: { presets: translations }}, { sortKeys: commentFirst, lineWidth: -1 })
    .replace(/[^\s]+#'?:/g, '#');
}


function writeEnJson(tstrings) {
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
      enjson.en.presets = tstrings;
      enjson.en.imagery = imagery.en.imagery;
      enjson.en.community = community.en;

      return fs.writeFileSync('dist/locales/en.json', JSON.stringify(enjson, null, 4));
    });
}


function writeFaIcons(faIcons) {
  for (const key in faIcons) {
    const prefix = key.substring(0, 3);   // `fas`, `far`, `fab`
    const name = key.substring(4);
    const def = fontawesome.findIconDefinition({ prefix: prefix, iconName: name });
    try {
      fs.writeFileSync(`svg/fontawesome/${key}.svg`, fontawesome.icon(def).html.toString());
    } catch (error) {
      console.error(`Error: No FontAwesome icon for ${key}`);
      throw (error);
    }
  }
}


function writeTnpIcons(tnpIcons) {
  /*
   * The Noun Project doesn't allow anonymous API access. New "tnp-" icons will
   * not be downloaded without a "the_noun_project.auth" file with a json object:
   *  {
   *    "consumer_key": "xxxxxx",
   *    "consumer_secret": "xxxxxx"
   *  }
   */
  let nounAuth;
  if (fs.existsSync('the_noun_project.auth')) {
    nounAuth = JSON.parse(fs.readFileSync('the_noun_project.auth', 'utf8'));
  }
  const baseURL = 'http://api.thenounproject.com/icon/';

  let unusedSvgFiles = fs.readdirSync('svg/the-noun-project', 'utf8')
    .reduce((obj, name) => {
      if (name.endsWith('.svg')) {
        obj[name] = true;
      }
      return obj;
    }, {});

  for (const key in tnpIcons) {
    const id = key.substring(4);
    const fileName = `${id}.svg`;

    if (unusedSvgFiles[fileName]) {
      delete unusedSvgFiles[fileName];
    }

    const localPath = `svg/the-noun-project/${fileName}`;

    // don't redownload existing icons
    if (fs.existsSync(localPath)) continue;

    if (!nounAuth) {
      console.error(`No authentication file for The Noun Project. Cannot download icon: ${key}`);
      continue;
    }

    const url = baseURL + id;
    request.get(url, { oauth : nounAuth }, handleTheNounProjectResponse);
  }

  // remove icons that are not needed
  for (const unusedFileName in unusedSvgFiles) {
    shell.rm('-f', [`svg/the-noun-project/${unusedFileName}`]);
  }
}


function handleTheNounProjectResponse(err, resp, body) {
  if (err) {
    console.error(err);
    return;
  }
  let icon = JSON.parse(body).icon;
  if (icon.license_description !== 'public-domain') {
    console.error('The icon "' + icon.term + '" (tnp-' + icon.id + ') from The Noun Project cannot be used in iD because it is not in the public domain.');
    return;
  }
  let iconURL = icon.icon_url;
  if (!iconURL) {
    console.error('The Noun Project has not provided a URL to download the icon "' + icon.term + '" (tnp-' + icon.id + ').');
    return;
  }
  request.get(iconURL, (err2, resp2, svg) => {
    if (err2) {
      console.error(err2);
      return;
    }
    try {
      fs.writeFileSync(`svg/the-noun-project/${icon.id}.svg`, svg);
    } catch (error) {
      console.error(error);
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
