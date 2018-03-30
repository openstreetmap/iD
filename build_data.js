/* eslint-disable no-console */
const requireESM = require('@std/esm')(module, { esm: 'js' });
const _cloneDeep = requireESM('lodash-es/cloneDeep').default;
const _extend = requireESM('lodash-es/extend').default;
const _forEach = requireESM('lodash-es/forEach').default;
const _isEmpty = requireESM('lodash-es/isEmpty').default;
const _merge = requireESM('lodash-es/merge').default;
const _toPairs = requireESM('lodash-es/toPairs').default;

const fs = require('fs');
const glob = require('glob');
const jsonschema = require('jsonschema');
const path = require('path');
const shell = require('shelljs');
const YAML = require('js-yaml');
const colors = require('colors/safe');
const maki = require('@mapbox/maki');

const fieldSchema = require('./data/presets/schema/field.json');
const presetSchema = require('./data/presets/schema/preset.json');
const suggestions = require('name-suggestion-index/name-suggestions.json');


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
                console.log(
                    `Creating symlink:  ${target} -> ${symlinks[target]}`
                );
                shell.ln('-sf', symlinks[target], target);
            }
        }

        // Translation strings
        var tstrings = {
            categories: {},
            fields: {},
            presets: {}
        };

        // Start clean
        shell.rm('-f', [
            'data/presets/categories.json',
            'data/presets/fields.json',
            'data/presets/presets.json',
            'data/presets.yaml',
            'data/taginfo.json',
            'dist/locales/en.json'
        ]);

        var categories = generateCategories(tstrings);
        var fields = generateFields(tstrings);
        var presets = generatePresets(tstrings);
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
                JSON.stringify({ categories: categories }, null, 4)
            ),
            writeFileProm(
                'data/presets/fields.json',
                JSON.stringify({ fields: fields }, null, 4)
            ),
            writeFileProm(
                'data/presets/presets.json',
                JSON.stringify({ presets: presets }, null, 4)
            ),
            writeFileProm('data/presets.yaml', translationsToYAML(translations)),
            writeFileProm('data/taginfo.json', JSON.stringify(taginfo, null, 4)),
            writeEnJson(tstrings)
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

function generateCategories(tstrings) {
    var categories = {};
    glob.sync(__dirname + '/data/presets/categories/*.json').forEach(function(file) {
        var field = read(file),
            id = 'category-' + path.basename(file, '.json');

        tstrings.categories[id] = {name: field.name};

        categories[id] = field;
    });
    return categories;
}

function generateFields(tstrings) {
    var fields = {};
    glob.sync(__dirname + '/data/presets/fields/**/*.json').forEach(function(file) {
        var field = read(file),
            id = stripLeadingUnderscores(file.match(/presets\/fields\/([^.]*)\.json/)[1]);

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
    });
    return fields;
}

function suggestionsToPresets(presets) {
    var existing = {};

    for (var key in suggestions) {
        for (var value in suggestions[key]) {
            for (var name in suggestions[key][value]) {
                var item = key + '/' + value + '/' + name,
                    tags = {},
                    count = suggestions[key][value][name].count;

                if (existing[name] && count > existing[name].count) {
                    delete presets[existing[name].category];
                    delete existing[name];
                }
                if (!existing[name]) {
                    tags = _extend({name: name.replace(/"/g, '')}, suggestions[key][value][name].tags);
                    addSuggestion(item, tags, name.replace(/"/g, ''), count);
                }
            }
        }
    }

    function addSuggestion(category, tags, name, count) {
        var tag = category.split('/'),
            parent = presets[tag[0] + '/' + tag[1]];


        // Hacky code to add healthcare tagging not yet present in name-suggestion-index
        // This will be fixed by https://github.com/osmlab/name-suggestion-index/issues/57
        if (tag[0] === 'amenity') {
            var healthcareTags = {
                clinic: 'clinic',
                dentist: 'dentist',
                doctors: 'doctor',
                hospital: 'hospital',
                pharmacy: 'pharmacy'
            };
            if (healthcareTags.hasOwnProperty(tag[1])) {
                tags.healthcare = healthcareTags[tag[1]];
            }
        }

        if (!parent) {
            console.log('WARN: no preset for suggestion = ' + tag);
            return;
        }

        presets[category.replace(/"/g, '')] = {
            tags: parent.tags ? _merge(tags, parent.tags) : tags,
            name: name,
            icon: parent.icon,
            geometry: parent.geometry,
            fields: parent.fields,
            suggestion: true
        };

        existing[name] = {
            category: category,
            count: count
        };
    }

    return presets;
}

function stripLeadingUnderscores(str) {
    return str.split('/').map(function(s) { return s.replace(/^_/,''); }).join('/');
}

function generatePresets(tstrings) {
    var presets = {};

    glob.sync(__dirname + '/data/presets/presets/**/*.json').forEach(function(file) {
        var preset = read(file),
            id = stripLeadingUnderscores(file.match(/presets\/presets\/([^.]*)\.json/)[1]);

        validate(file, preset, presetSchema);

        tstrings.presets[id] = {
            name: preset.name,
            terms: (preset.terms || []).join(',')
        };
        presets[id] = preset;
    });

    presets = _merge(presets, suggestionsToPresets(presets));
    return presets;

}

function generateTranslations(fields, presets, tstrings) {
    var translations = _cloneDeep(tstrings);

    _forEach(translations.fields, function(field, id) {
        var f = fields[id];
        if (f.keys) {
            field['label#'] = _forEach(f.keys).map(function(key) { return key + '=*'; }).join(', ');
            if (!_isEmpty(field.options)) {
                _forEach(field.options, function(v,k) {
                    if (id === 'access') {
                        field.options[k]['title#'] = field.options[k]['description#'] = 'access=' + k;
                    } else {
                        field.options[k + '#'] = k + '=yes';
                    }
                });
            }
        } else if (f.key) {
            field['label#'] = f.key + '=*';
            if (!_isEmpty(field.options)) {
                _forEach(field.options, function(v,k) {
                    field.options[k + '#'] = f.key + '=' + k;
                });
            }
        }

        if (f.placeholder) {
            field['placeholder#'] = id + ' field placeholder';
        }
    });

    _forEach(translations.presets, function(preset, id) {
        var p = presets[id];
        if (!_isEmpty(p.tags))
            preset['name#'] = _toPairs(p.tags).map(function(pair) { return pair[0] + '=' + pair[1]; }).join(', ');
        if (p.searchable !== false) {
            if (p.terms && p.terms.length)
                preset['terms#'] = 'terms: ' + p.terms.join();
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

    _forEach(presets, function(preset) {

        if (preset.suggestion)
            return;

        var keys = Object.keys(preset.tags),
            last = keys[keys.length - 1],
            tag = { key: last };

        if (!last)
            return;

        if (preset.tags[last] !== '*') {
            tag.value = preset.tags[last];
        }

        if (preset.name) {
          tag.description = [ preset.name ];
        }

        if (preset.geometry) {
          setObjectType(tag, preset);
        }

        if (isMaki(preset.icon)) {
            tag.icon_url = 'https://raw.githubusercontent.com/mapbox/maki/master/icons/' + preset.icon + '-15.svg?sanitize=true';
        }

        coalesceTags(taginfo, tag);
    });

    _forEach(fields, function(field) {

        var keys = field.keys || [ field.key ] || [];

        keys.forEach(function(key) {
            if (field.strings && field.strings.options) {
               var values = Object.keys(field.strings.options);
               values.forEach(function(value) {
                   var tag = { key:   key,
                               value: value };
                   if (field.label) {
                      tag.description = [ field.label ];
                   }
                   coalesceTags(taginfo, tag);
               });
            }
            else {
               var tag = { key: key };
               if (field.label) {
                  tag.description = [ field.label ];
               }
               coalesceTags(taginfo, tag);
            }
        });
    });

    _forEach(taginfo.tags, function(elem) {
       if (elem.description)
          elem.description = elem.description.join(', ');
    });

    function coalesceTags(taginfo, tag) {

       if (!tag.key)
         return;

       var currentTaginfoEntries = taginfo.tags.filter(function(t) {
           return (t.key    === tag.key &&
                   t.value  === tag.value);
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

    function isMaki(icon) {
        var dataFeatureIcons = maki.layouts.all.all;
        return (icon && dataFeatureIcons.indexOf(icon) !== -1);
    }

    function setObjectType(tag, input) {
      tag.object_types = [];
      const mapping = { 'point'    : 'node',
                        'vertex'   : 'node',
                        'line'     : 'way',
                        'relation' : 'relation',
                        'area'     : 'area' };

      input.geometry.forEach(function(geom) {
         if (tag.object_types.indexOf(mapping[geom]) === -1) {
           tag.object_types.push(mapping[geom]);
         }
      });
    }

    return taginfo;
}

function validateCategoryPresets(categories, presets) {
    _forEach(categories, function(category) {
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
    _forEach(presets, function(preset) {
        if (preset.fields) {
            preset.fields.forEach(function(field) {
                if (fields[field] === undefined) {
                    console.error('Unknown preset field: ' + field + ' in preset ' + preset.name);
                    process.exit(1);
                }
            });
        }
    });
}

function validateDefaults (defaults, categories, presets) {
    _forEach(defaults.defaults, function (members, name) {
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
    var readImagery = readFileProm(
        'node_modules/editor-layer-index/i18n/en.yaml',
        'utf8'
    );

    return Promise.all([readCoreYaml, readImagery]).then(function(data) {
        var core = YAML.load(data[0]);
        var imagery = YAML.load(data[1]);
        var en = _merge(core, { en: { presets: tstrings } }, imagery);
        return writeFileProm(
            'dist/locales/en.json',
            JSON.stringify(en, null, 4)
        );
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
