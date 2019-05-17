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
const nsi = require('name-suggestion-index');
const deprecated = require('./data/deprecated.json').dataDeprecated;

// fontawesome icons
const fontawesome = require('@fortawesome/fontawesome-svg-core');
const fas = require('@fortawesome/free-solid-svg-icons').fas;
const far = require('@fortawesome/free-regular-svg-icons').far;
const fab = require('@fortawesome/free-brands-svg-icons').fab;
fontawesome.library.add(fas, far, fab);

const request = require('request').defaults({ maxSockets: 1 });

module.exports = function buildData() {
    var building;
    return function() {
        // Note: even though this function is sync adding
        // the `building` variable for consistency and future proofing
        if (building) return;
        building = true;
        console.log('building data');
        console.time(colors.green('data built'));

        // Create symlinks if necessary..  { 'target': 'source' }
        const symlinks = {
            'land.html': 'dist/land.html',
            img: 'dist/img'
        };

        for (var target of Object.keys(symlinks)) {
            if (!shell.test('-L', target)) {
                console.log(`Creating symlink:  ${target} -> ${symlinks[target]}`);
                shell.ln('-sf', symlinks[target], target);
            }
        }

        // Translation strings
        var tstrings = {
            categories: {},
            fields: {},
            presets: {}
        };

        // Font Awesome icons used
        var faIcons = {
            'fas-i-cursor': {},
            'fas-long-arrow-alt-right': {},
            'fas-th-list': {}
        };

        // The Noun Project icons used
        var tnpIcons = {};

        // Start clean
        shell.rm('-f', [
            'data/presets/categories.json',
            'data/presets/fields.json',
            'data/presets/presets.json',
            'data/presets.yaml',
            'data/taginfo.json',
            'dist/locales/en.json',
            'svg/fontawesome/*.svg',
        ]);

        var categories = generateCategories(tstrings, faIcons, tnpIcons);
        var fields = generateFields(tstrings, faIcons);
        var presets = generatePresets(tstrings, faIcons, tnpIcons);
        var defaults = read('data/presets/defaults.json');
        var translations = generateTranslations(fields, presets, tstrings);
        var taginfo = generateTaginfo(presets, fields);

        // Additional consistency checks
        validateCategoryPresets(categories, presets);
        validatePresetFields(presets, fields);
        validateDefaults(defaults, categories, presets);

        // Save individual data files
        var tasks = [
            writeFileProm(
                'data/presets/categories.json',
                prettyStringify({ categories: categories })
            ),
            writeFileProm(
                'data/presets/fields.json',
                prettyStringify({ fields: fields }, { maxLength: 9999 })
            ),
            writeFileProm(
                'data/presets/presets.json',
                prettyStringify({ presets: presets }, { maxLength: 9999 })
            ),
            writeFileProm(
                'data/presets.yaml',
                translationsToYAML(translations)
            ),
            writeFileProm(
                'data/taginfo.json',
                prettyStringify(taginfo, { maxLength: 9999 })
            ),
            writeEnJson(tstrings),
            writeFaIcons(faIcons),
            writeTnpIcons(tnpIcons)
        ];

        return Promise.all(tasks)
            .then(function () {
                console.timeEnd(colors.green('data built'));
                building = false;
            })
            .catch(function (err) {
                console.error(err);
                process.exit(1);
            });
    };
};


function read(f) {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
}


function validate(file, instance, schema) {
    var validationErrors = jsonschema.validate(instance, schema).errors;
    if (validationErrors.length) {
        console.error(file + ': ');
        validationErrors.forEach(function(error) {
            if (error.property) {
                console.error(error.property + ' ' + error.message);
            } else {
                console.error(error);
            }
        });
        process.exit(1);
    }
}


function generateCategories(tstrings, faIcons, tnpIcons) {
    var categories = {};
    glob.sync(__dirname + '/data/presets/categories/*.json').forEach(function(file) {
        var category = read(file);
        var id = 'category-' + path.basename(file, '.json');
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


function generateFields(tstrings, faIcons, tnpIcons) {
    var fields = {};
    glob.sync(__dirname + '/data/presets/fields/**/*.json').forEach(function(file) {
        var field = read(file);
        var id = stripLeadingUnderscores(file.match(/presets\/fields\/([^.]*)\.json/)[1]);

        validate(file, field, fieldSchema);

        var t = tstrings.fields[id] = {
            label: field.label
        };

        if (field.placeholder) {
            t.placeholder = field.placeholder;
        }

        if (field.strings) {
            for (var i in field.strings) {
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

        let wikidataTag = { 'brand:wikidata': qid };
        let suggestionID = presetID + '/' + name;

        let logoURL;
        let logoURLs = wikidata[qid] && wikidata[qid].logos;
        if (logoURLs) {
            // Prefer a wiki commons logo in svg?.. #6361
            // Currently commmented out, because these logos tend to not be square
            // if (logoURLs.wikidata && /\.svg&width/i.test(logoURLs.wikidata)) {
            //     logoURL = logoURLs.wikidata;

            // Next, a Facebook profile picture (but not for a brand likely to have an age restriction)
            if (logoURLs.facebook && !/^shop\/(alcohol|erotic|tobacco)$/.test(kv)) {
                logoURL = logoURLs.facebook.replace('?type=square', '?type=large');
            // Finally, Twitter profile picture or a non-svg wiki commons logo..
            } else {
                logoURL = logoURLs.twitter || logoURLs.wikidata;
            }
        }

        presets[suggestionID] = {
            name: name,
            icon: preset.icon,
            imageURL: logoURL,
            geometry: preset.geometry,
            tags: Object.assign({}, preset.tags, wikidataTag),
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


function generatePresets(tstrings, faIcons, tnpIcons) {
    var presets = {};

    glob.sync(__dirname + '/data/presets/presets/**/*.json').forEach(function(file) {
        var preset = read(file);
        var id = stripLeadingUnderscores(file.match(/presets\/presets\/([^.]*)\.json/)[1]);

        validate(file, preset, presetSchema);

        tstrings.presets[id] = {
            name: preset.name,
            terms: (preset.terms || []).join(',')
        };

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


function generateTranslations(fields, presets, tstrings) {
    var translations = JSON.parse(JSON.stringify(tstrings));  // deep clone

    Object.keys(translations.fields).forEach(function(id) {
        var field = translations.fields[id];
        var f = fields[id];
        var options = field.options || {};
        var optkeys = Object.keys(options);

        if (f.keys) {
            field['label#'] = f.keys.map(function(k) { return k + '=*'; }).join(', ');
            optkeys.forEach(function(k) {
                if (id === 'access') {
                    options[k]['title#'] = options[k]['description#'] = 'access=' + k;
                } else {
                    options[k + '#'] = k + '=yes';
                }
            });
        } else if (f.key) {
            field['label#'] = f.key + '=*';
            optkeys.forEach(function(k) {
                options[k + '#'] = f.key + '=' + k;
            });
        }

        if (f.placeholder) {
            field['placeholder#'] = id + ' field placeholder';
        }
    });

    Object.keys(translations.presets).forEach(function(id) {
        var preset = translations.presets[id];
        var p = presets[id];
        var tags = p.tags || {};
        var keys = Object.keys(tags);

        if (keys.length) {
            preset['name#'] = keys.map(function(k) { return k + '=' + tags[k]; }).join(', ');
        }
        if (p.searchable !== false) {
            if (p.terms && p.terms.length) {
                preset['terms#'] = 'terms: ' + p.terms.join();
            }
            preset.terms = '<translate with synonyms or related terms for \'' + preset.name + '\', separated by commas>';
        } else {
            delete preset.terms;
        }
    });

    return translations;
}


function generateTaginfo(presets, fields) {
    var taginfo = {
        'data_format': 1,
        'data_url': 'https://raw.githubusercontent.com/openstreetmap/iD/master/data/taginfo.json',
        'project': {
            'name': 'iD Editor',
            'description': 'Online editor for OSM data.',
            'project_url': 'https://github.com/openstreetmap/iD',
            'doc_url': 'https://github.com/openstreetmap/iD/blob/master/data/presets/README.md',
            'icon_url': 'https://raw.githubusercontent.com/openstreetmap/iD/master/dist/img/logo.png',
            'keywords': [
                'editor'
            ]
        },
        'tags': []
    };

    Object.keys(presets).forEach(function(id) {
        var preset = presets[id];
        if (preset.suggestion) return;

        var keys = Object.keys(preset.tags);
        var last = keys[keys.length - 1];
        var tag = { key: last };

        if (!last) return;

        if (preset.tags[last] !== '*') {
            tag.value = preset.tags[last];
        }
        if (preset.name) {
            var legacy = (preset.searchable === false) ? ' (unsearchable)' : '';
            tag.description = [ '🄿 ' + preset.name + legacy ];
        }
        if (preset.geometry) {
            setObjectType(tag, preset);
        }

        // add icon
        if (/^maki-/.test(preset.icon)) {
            tag.icon_url = 'https://raw.githubusercontent.com/mapbox/maki/master/icons/' +
                preset.icon.replace(/^maki-/, '') + '-15.svg?sanitize=true';
        } else if (/^temaki-/.test(preset.icon)) {
            tag.icon_url = 'https://raw.githubusercontent.com/bhousel/temaki/master/icons/' +
                preset.icon.replace(/^temaki-/, '') + '.svg?sanitize=true';
        } else if (/^fa[srb]-/.test(preset.icon)) {
            tag.icon_url = 'https://raw.githubusercontent.com/openstreetmap/iD/master/svg/fontawesome/' +
                preset.icon + '.svg?sanitize=true';
        } else if (/^iD-/.test(preset.icon)) {
            tag.icon_url = 'https://raw.githubusercontent.com/openstreetmap/iD/master/svg/iD-sprite/presets/' +
                preset.icon.replace(/^iD-/, '') + '.svg?sanitize=true';
        } else if (/^tnp-/.test(preset.icon)) {
            tag.icon_url = 'https://raw.githubusercontent.com/openstreetmap/iD/master/svg/the-noun-project/' +
                preset.icon.replace(/^tnp-/, '') + '.svg?sanitize=true';
        }

        coalesceTags(taginfo, tag);
    });

    Object.keys(fields).forEach(function(id) {
        var field = fields[id];
        var keys = field.keys || [ field.key ] || [];
        var isRadio = (field.type === 'radio' || field.type === 'structureRadio');

        keys.forEach(function(key) {
            if (field.strings && field.strings.options && !isRadio) {
                var values = Object.keys(field.strings.options);
                values.forEach(function(value) {
                    if (value === 'undefined' || value === '*' || value === '') return;
                    var tag = { key: key, value: value };
                    if (field.label) {
                        tag.description = [ '🄵 ' + field.label ];
                    }
                    coalesceTags(taginfo, tag);
                });
            } else {
                var tag = { key: key };
                if (field.label) {
                    tag.description = [ '🄵 ' + field.label ];
                }
                coalesceTags(taginfo, tag);
            }
        });
    });

    deprecated.forEach(function(elem) {
        var old = elem.old;
        var oldKeys = Object.keys(old);
        if (oldKeys.length === 1) {
            var oldKey = oldKeys[0];
            var tag = { key: oldKey };

            var oldValue = old[oldKey];
            if (oldValue !== '*') tag.value = oldValue;
            var replacementStrings = [];
            for (var replaceKey in elem.replace) {
                var replaceValue = elem.replace[replaceKey];
                if (replaceValue === '$1') replaceValue = '*';
                replacementStrings.push(replaceKey + '=' + replaceValue);
            }
            var description = '🄳';
            if (replacementStrings.length > 0) {
                description += ' ➜ ' + replacementStrings.join(' + ');
            }
            tag.description = [description];
            coalesceTags(taginfo, tag);
        }
    });

    taginfo.tags.forEach(function(elem) {
        if (elem.description) {
            elem.description = elem.description.join(', ');
        }
    });


    function coalesceTags(taginfo, tag) {
        if (!tag.key) return;

        var currentTaginfoEntries = taginfo.tags.filter(function(t) {
            return (t.key === tag.key && t.value === tag.value);
        });

        if (currentTaginfoEntries.length === 0) {
            taginfo.tags.push(tag);
            return;
        }

        if (!tag.description)
            return;

        if (!currentTaginfoEntries[0].description) {
            currentTaginfoEntries[0].description = tag.description;
            return;
        }

        var isNewDescription = currentTaginfoEntries[0].description
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

        input.geometry.forEach(function(geom) {
            if (tag.object_types.indexOf(mapping[geom]) === -1) {
                tag.object_types.push(mapping[geom]);
            }
        });
    }

    return taginfo;
}

function validateCategoryPresets(categories, presets) {
    Object.keys(categories).forEach(function(id) {
        var category = categories[id];
        if (category.members) {
            category.members.forEach(function(preset) {
                if (presets[preset] === undefined) {
                    console.error('Unknown preset: ' + preset + ' in category ' + category.name);
                    process.exit(1);
                }
            });
        }
    });
}

function validatePresetFields(presets, fields) {
    var betweenBracketsRegex = /([^{]*?)(?=\})/;
    var maxFieldsBeforeError = 12;
    var maxFieldsBeforeWarning = 8;
    for (var presetID in presets) {
        var preset = presets[presetID];

        if (preset.replacement) {
            var replacementPreset = presets[preset.replacement];
            var p1geometry = preset.geometry.slice().sort.toString();
            var p2geometry = replacementPreset.geometry.slice().sort.toString();
            if (replacementPreset === undefined) {
                console.error('Unknown preset "' + preset.replacement + '" referenced as replacement of preset ' + preset.name);
                process.exit(1);
            } else if (p1geometry !== p2geometry) {
                console.error('The preset "' + presetID + '" has different geometry than its replacement preset, "' + preset.replacement + '". They must match for tag upgrades to work.');
                process.exit(1);
            }
        }

        // the keys for properties that contain arrays of field ids
        var fieldKeys = ['fields', 'moreFields'];
        for (var fieldsKeyIndex in fieldKeys) {
            var fieldsKey = fieldKeys[fieldsKeyIndex];
            if (preset[fieldsKey]) {
                for (var fieldIndex in preset[fieldsKey]) {
                    var field = preset[fieldsKey][fieldIndex];
                    if (fields[field] === undefined) {
                        var regexResult = betweenBracketsRegex.exec(field);
                        if (regexResult) {
                            var foreignPresetID = regexResult[0];
                            if (presets[foreignPresetID] === undefined) {
                                console.error('Unknown preset "' + foreignPresetID + '" referenced in "' + fieldsKey + '" array of preset ' + preset.name);
                                process.exit(1);
                            }
                        } else {
                            console.error('Unknown preset field "' + field + '" in "' + fieldsKey + '" array of preset ' + preset.name);
                            process.exit(1);
                        }
                    }
                }
            }
        }

        if (preset.fields) {
            // since `moreFields` is available, check that `fields` doesn't get too cluttered
            var fieldCount = preset.fields.length;

            if (fieldCount > maxFieldsBeforeWarning) {
                // Fields with `prerequisiteTag` probably won't show up initially,
                // so don't count them against the limits.
                var fieldsWithoutPrerequisites = preset.fields.filter(function(fieldID) {
                    if (fields[fieldID] && fields[fieldID].prerequisiteTag) {
                        return false;
                    }
                    return true;
                });
                fieldCount = fieldsWithoutPrerequisites.length;
            }
            if (fieldCount > maxFieldsBeforeError) {
                console.error(fieldCount + ' values in "fields" of "' + preset.name + '" (' + presetID + '). Limit: ' + maxFieldsBeforeError + '. Please move lower-priority fields to "moreFields".');
                process.exit(1);
            }
            else if (fieldCount > maxFieldsBeforeWarning) {
                console.log('Warning: ' + fieldCount + ' values in "fields" of "' + preset.name + '" (' + presetID + '). Recommended: ' + maxFieldsBeforeWarning + ' or fewer. Consider moving lower-priority fields to "moreFields".');
            }
        }
    }
}

function validateDefaults (defaults, categories, presets) {
    Object.keys(defaults.defaults).forEach(function(name) {
        var members = defaults.defaults[name];
        members.forEach(function (id) {
            if (!presets[id] && !categories[id]) {
                console.error('Unknown category or preset: ' + id + ' in default ' + name);
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
    var readCoreYaml = readFileProm('data/core.yaml', 'utf8');
    var readImagery = readFileProm('node_modules/editor-layer-index/i18n/en.yaml', 'utf8');
    var readCommunity = readFileProm('node_modules/osm-community-index/i18n/en.yaml', 'utf8');

    return Promise.all([readCoreYaml, readImagery, readCommunity]).then(function(data) {
        var core = YAML.load(data[0]);
        var imagery = YAML.load(data[1]);
        var community = YAML.load(data[2]);

        var enjson = core;
        enjson.en.presets = tstrings;
        enjson.en.imagery = imagery.en.imagery;
        enjson.en.community = community.en;

        return writeFileProm('dist/locales/en.json', JSON.stringify(enjson, null, 4));
    });
}


function writeFaIcons(faIcons) {
    for (var key in faIcons) {
        var prefix = key.substring(0, 3);   // `fas`, `far`, `fab`
        var name = key.substring(4);
        var def = fontawesome.findIconDefinition({ prefix: prefix, iconName: name });
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
     *      "consumer_key": "xxxxxx",
     *      "consumer_secret": "xxxxxx"
     *  }
     *  */
    var nounAuth;
    if (fs.existsSync('./the_noun_project.auth')) {
        nounAuth = JSON.parse(fs.readFileSync('./the_noun_project.auth', 'utf8'));
    }
    var baseURL = 'http://api.thenounproject.com/icon/';

    var unusedSvgFiles = fs.readdirSync('svg/the-noun-project', 'utf8').reduce(function(obj, name) {
        if (name.endsWith('.svg')) {
            obj[name] = true;
        }
        return obj;
    }, {});

    for (var key in tnpIcons) {
        var id = key.substring(4);
        var fileName = id + '.svg';

        if (unusedSvgFiles[fileName]) {
            delete unusedSvgFiles[fileName];
        }

        var localPath = 'svg/the-noun-project/' + fileName;

        // don't redownload existing icons
        if (fs.existsSync(localPath)) continue;

        if (!nounAuth) {
            console.error('No authentication file for The Noun Project. Cannot download icon: ' + key);
            continue;
        }

        var url = baseURL + id;
        request.get(url, { oauth : nounAuth }, handleTheNounProjectResponse);
    }

    // remove icons that are not needed
    for (var unusedFileName in unusedSvgFiles) {
        shell.rm('-f', [
            'svg/the-noun-project/' + unusedFileName
        ]);
    }
}

function handleTheNounProjectResponse(err, resp, body) {
    if (err) {
        console.error(err);
        return;
    }
    var icon = JSON.parse(body).icon;
    if (icon.license_description !== 'public-domain') {
        console.error('The icon "' + icon.term + '" (tnp-' + icon.id + ') from The Noun Project cannot be used in iD because it is not in the public domain.');
        return;
    }
    var iconURL = icon.icon_url;
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
    return new Promise(function(res, rej) {
        fs.writeFile(path, content, function(err) {
            if (err) {
                return rej(err);
            }
            res();
        });
    });
}


function readFileProm(path, options) {
    return new Promise(function(res, rej) {
        fs.readFile(path, options, function(err, data) {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}
