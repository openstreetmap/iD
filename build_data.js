/* eslint-disable no-console */
const colors = require('colors/safe');
const fs = require('fs');
const glob = require('glob');
const jsonschema = require('jsonschema');
const path = require('path');
const prettyStringify = require('json-stringify-pretty-compact');
const shell = require('shelljs');
const YAML = require('js-yaml');

const fieldSchema = require('./data/presets/schema/field.json');
const presetSchema = require('./data/presets/schema/preset.json');
const groupSchema = require('./data/presets/schema/group.json');
const nsi = require('name-suggestion-index');
const deprecated = require('./data/deprecated.json').dataDeprecated;

// fontawesome icons
const fontawesome = require('@fortawesome/fontawesome-svg-core');
const fas = require('@fortawesome/free-solid-svg-icons').fas;
const far = require('@fortawesome/free-regular-svg-icons').far;
const fab = require('@fortawesome/free-brands-svg-icons').fab;
fontawesome.library.add(fas, far, fab);

const request = require('request').defaults({ maxSockets: 1 });

let _currBuild = null;


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
    groups: {},
    fields: {},
    presets: {}
  };

  // Font Awesome icons used
  let faIcons = {
    'fas-smile-beam': {},
    'fas-grin-beam': {},
    'fas-laugh-beam': {},
    'fas-sun': {},
    'fas-moon': {},
    'fas-edit': {},
    'fas-map-marked-alt': {},
    'fas-toolbox': {},
    'fas-clock': {},
    'fas-birthday-cake': {},
    'fas-i-cursor': {},
    'fas-lock': {},
    'fas-long-arrow-alt-right': {},
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
    'data/territory-languages.json',
    'dist/locales/en.json',
    //'svg/fontawesome/*.svg',
  ]);

  var groups = generateGroups(tstrings);
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

  // Save individual data files
  let tasks = [
    writeFileProm('data/presets/categories.json', prettyStringify({ categories: categories }) ),
    writeFileProm('data/presets/fields.json', prettyStringify({ fields: fields }, { maxLength: 9999 }) ),
    writeFileProm('data/presets/presets.json', prettyStringify({ presets: presets }, { maxLength: 9999 }) ),
    writeFileProm('data/presets.yaml', translationsToYAML(translations) ),
    writeFileProm('data/presets/groups.json', prettyStringify({ groups: groups }, { maxLength: 1000 })),
    writeFileProm('data/taginfo.json', prettyStringify(taginfo, { maxLength: 9999 }) ),
    writeFileProm('data/territory-languages.json', prettyStringify({ dataTerritoryLanguages: territoryLanguages }, { maxLength: 9999 }) ),
    writeEnJson(tstrings),
    writeFaIcons(faIcons),
    writeTnpIcons(tnpIcons)
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
    console.error(file + ': ');
    validationErrors.forEach((error) => {
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


function generateCategories(tstrings, faIcons, tnpIcons) {
  let categories = {};

  glob.sync(__dirname + '/data/presets/categories/*.json').forEach(file => {
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

  glob.sync(__dirname + '/data/presets/fields/**/*.json').forEach(file => {
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

function generateGroups(tstrings) {
  let groups = {};
  glob.sync(__dirname + '/data/presets/groups/**/*.json').forEach(file => {
    let group = read(file);
    let id = stripLeadingUnderscores(file.match(/presets\/groups\/([^.]*)\.json/)[1]);
    validate(file, group, groupSchema);

    let t = {};
    if (group.name) {
      t.name = group.name;
    }
    if (group.description) {
      t.description = group.description;
    }
    if (Object.keys(t).length > 0) {
      tstrings.groups[id] = t;
    }

    if (group.note) {
      // notes are only used for developer documentation
      delete group.note;
    }

    groups[id] = group;
  });

  return groups;
}


function suggestionsToPresets(presets) {
  const brands = nsi.brands.brands;
  const wikidata = nsi.wikidata.wikidata;

  Object.keys(brands).forEach(kvnd => {
    const suggestion = brands[kvnd];
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
      console.log('Warning:  No preset "' + presetID + '" for name-suggestion "' + name + '"');
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
    let logoURLs = wikidata[qid] && wikidata[qid].logos;
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
    .map(function(s) { return s.replace(/^_/,''); })
    .join('/');
}


function generatePresets(tstrings, faIcons, tnpIcons, searchableFieldIDs) {
  let presets = {};

  glob.sync(__dirname + '/data/presets/presets/**/*.json').forEach(file => {
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
      field['label#'] = f.keys.map(k => { return k + '=*'; }).join(', ');
      optkeys.forEach(k => {
        if (id === 'access') {
          options[k]['title#'] = options[k]['description#'] = 'access=' + k;
        } else {
          options[k + '#'] = k + '=yes';
        }
      });
    } else if (f.key) {
      field['label#'] = f.key + '=*';
      optkeys.forEach(k => {
        options[k + '#'] = f.key + '=' + k;
      });
    }

    if (f.placeholder) {
      field['placeholder#'] = id + ' field placeholder';
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
      preset['name#'] = keys.map(k => { return k + '=' + tags[k]; }).join(', ');
    }

    if (p.searchable !== false) {
      if (p.terms && p.terms.length) {
        preset['terms#'] = 'terms: ' + p.terms.join();
      }
      preset.terms = '<translate with synonyms or related terms for \'' + preset.name + '\', separated by commas>';
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
    'data_url': 'https://raw.githubusercontent.com/openstreetmap/iD/master/data/taginfo.json',
    'project': {
      'name': 'iD Editor',
      'description': 'Online editor for OSM data.',
      'project_url': 'https://github.com/openstreetmap/iD',
      'doc_url': 'https://github.com/openstreetmap/iD/blob/master/data/presets/README.md',
      'icon_url': 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@release/dist/img/logo.png',
      'keywords': ['editor']
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
      tag.description = [ '🄿 ' + preset.name + legacy ];
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
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@master/svg/fontawesome/' +
        preset.icon + '.svg';
    } else if (/^iD-/.test(preset.icon)) {
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@master/svg/iD-sprite/presets/' +
        preset.icon.replace(/^iD-/, '') + '.svg';
    } else if (/^tnp-/.test(preset.icon)) {
      tag.icon_url = 'https://cdn.jsdelivr.net/gh/openstreetmap/iD@master/svg/the-noun-project/' +
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
            tag.description = [ '🄵 ' + field.label ];
          }
          coalesceTags(taginfo, tag);
        });
      } else {
        let tag = { key: key };
        if (field.label) {
          tag.description = [ '🄵 ' + field.label ];
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
        replacementStrings.push(replaceKey + '=' + replaceValue);
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

    let currentTaginfoEntries = taginfo.tags.filter(t => {
      return (t.key === tag.key && t.value === tag.value);
    });

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
  let allRawInfo = read('./node_modules/cldr-core/supplemental/territoryInfo.json').supplemental.territoryInfo;
  let territoryLanguages = {};

  Object.keys(allRawInfo).forEach(territoryCode => {
    let territoryLangInfo = allRawInfo[territoryCode].languagePopulation;
    if (!territoryLangInfo) return;
    let langCodes = Object.keys(territoryLangInfo);

    territoryLanguages[territoryCode.toLowerCase()] = langCodes.sort(function(langCode1, langCode2) {
      let popPercent1 = parseFloat(territoryLangInfo[langCode1]._populationPercent);
      let popPercent2 = parseFloat(territoryLangInfo[langCode2]._populationPercent);
      if (popPercent1 === popPercent2) {
        return langCode1.localeCompare(langCode2, 'en', { sensitivity: 'base' });
      }
      return popPercent2 - popPercent1;
    }).map(langCode => { return langCode.replace('_', '-'); });
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
  const maxFieldsBeforeError = 20;
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
        let fieldsWithoutPrerequisites = preset.fields.filter(fieldID => {
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
  Object.keys(defaults.defaults).forEach(name => {
    let members = defaults.defaults[name];
    members.forEach(id => {
      if (!presets[id] && !categories[id]) {
        console.error('Unknown category or preset: ' + id + ' in default ' + name);
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
    .replace(/\'.*#\':/g, '#');
}


function writeEnJson(tstrings) {
  const readCoreYaml = readFileProm('data/core.yaml', 'utf8');
  const readImagery = readFileProm('node_modules/editor-layer-index/i18n/en.yaml', 'utf8');
  const readCommunity = readFileProm('node_modules/osm-community-index/i18n/en.yaml', 'utf8');

  return Promise.all([readCoreYaml, readImagery, readCommunity])
    .then(data => {
      let core = YAML.load(data[0]);
      let imagery = YAML.load(data[1]);
      let community = YAML.load(data[2]);

      let enjson = core;
      enjson.en.presets = tstrings;
      enjson.en.imagery = imagery.en.imagery;
      enjson.en.community = community.en;

      return writeFileProm('dist/locales/en.json', JSON.stringify(enjson, null, 4));
    });
}


function writeFaIcons(faIcons) {
  for (const key in faIcons) {
    const prefix = key.substring(0, 3);   // `fas`, `far`, `fab`
    const name = key.substring(4);
    const def = fontawesome.findIconDefinition({ prefix: prefix, iconName: name });
    try {
      writeFileProm('svg/fontawesome/' + key + '.svg', fontawesome.icon(def).html);
    } catch (error) {
      console.error('Error: No FontAwesome icon for ' + key);
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
  if (fs.existsSync('./the_noun_project.auth')) {
    nounAuth = JSON.parse(fs.readFileSync('./the_noun_project.auth', 'utf8'));
  }
  const baseURL = 'http://api.thenounproject.com/icon/';

  let unusedSvgFiles = fs.readdirSync('svg/the-noun-project', 'utf8')
    .reduce(function(obj, name) {
      if (name.endsWith('.svg')) {
        obj[name] = true;
      }
      return obj;
    }, {});

  for (const key in tnpIcons) {
    const id = key.substring(4);
    const fileName = id + '.svg';

    if (unusedSvgFiles[fileName]) {
      delete unusedSvgFiles[fileName];
    }

    const localPath = 'svg/the-noun-project/' + fileName;

    // don't redownload existing icons
    if (fs.existsSync(localPath)) continue;

    if (!nounAuth) {
      console.error('No authentication file for The Noun Project. Cannot download icon: ' + key);
      continue;
    }

    const url = baseURL + id;
    request.get(url, { oauth : nounAuth }, handleTheNounProjectResponse);
  }

  // remove icons that are not needed
  for (const unusedFileName in unusedSvgFiles) {
    shell.rm('-f', ['svg/the-noun-project/' + unusedFileName]);
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
  request.get(iconURL, function(err2, resp2, svg) {
    if (err2) {
      console.error(err2);
      return;
    }
    try {
      writeFileProm('svg/the-noun-project/' + icon.id + '.svg', svg);
    } catch (error) {
      console.error(error);
      throw (error);
    }
  });
}


function writeFileProm(path, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content.toString(), (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}


function readFileProm(path, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}


module.exports = buildData;
