/* eslint-disable no-console */

const _ = require('lodash');
const fs = require('fs');
const glob = require('glob');
const jsonschema = require('jsonschema');
const path = require('path');
const shell = require('shelljs');
const YAML = require('js-yaml');

const fieldSchema = require('./data/presets/schema/field.json');
const presetSchema = require('./data/presets/schema/preset.json');
const suggestions = require('name-suggestion-index/name-suggestions.json');


// Create symlinks if necessary..  { 'target': 'source' }
const symlinks = {
    'land.html': 'dist/land.html',
    'img': 'dist/img',
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


// Start clean
shell.rm('-f', [
    'data/presets/categories.json',
    'data/presets/fields.json',
    'data/presets/presets.json',
    'data/presets.yaml',
    'data/taginfo.json',
    'dist/locales/en.json'
]);

var categories = generateCategories();
var fields = generateFields();
var presets = generatePresets();
var defaults = read('data/presets/defaults.json');
var translations = generateTranslations(fields, presets);
var taginfo = generateTaginfo(presets);

// Additional consistency checks
validateCategoryPresets(categories, presets);
validatePresetFields(presets, fields);
validateDefaults(defaults, categories, presets);

// Save individual data files
fs.writeFileSync('data/presets/categories.json', JSON.stringify({ categories: categories }, null, 4));
fs.writeFileSync('data/presets/fields.json', JSON.stringify({ fields: fields }, null, 4));
fs.writeFileSync('data/presets/presets.json', JSON.stringify({ presets: presets }, null, 4));
fs.writeFileSync('data/presets.yaml', translationsToYAML(translations));
fs.writeFileSync('data/taginfo.json', JSON.stringify(taginfo, null, 4));

// Push changes from data/core.yaml into en.json
var core = YAML.load(fs.readFileSync('data/core.yaml', 'utf8'));
var imagery = YAML.load(fs.readFileSync('node_modules/editor-layer-index/i18n/en.yaml', 'utf8'));
var en = _.merge(core, { en: { presets: tstrings }}, imagery);
fs.writeFileSync('dist/locales/en.json', JSON.stringify(en, null, 4));

process.exit();


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

function generateCategories() {
    var categories = {};
    glob.sync(__dirname + '/data/presets/categories/*.json').forEach(function(file) {
        var field = read(file),
            id = 'category-' + path.basename(file, '.json');

        tstrings.categories[id] = {name: field.name};

        categories[id] = field;
    });
    return categories;
}

function generateFields() {
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
                    tags = _.extend({name: name.replace(/"/g, '')}, suggestions[key][value][name].tags);
                    addSuggestion(item, tags, name.replace(/"/g, ''), count);
                }
            }
        }
    }

    function addSuggestion(category, tags, name, count) {
        var tag = category.split('/'),
            parent = presets[tag[0] + '/' + tag[1]];

        if (!parent) {
            console.log('WARN: no preset for suggestion = ' + tag);
            return;
        }

        presets[category.replace(/"/g, '')] = {
            tags: parent.tags ? _.merge(tags, parent.tags) : tags,
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

function generatePresets() {
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

    presets = _.merge(presets, suggestionsToPresets(presets));
    return presets;

}

function generateTranslations(fields, presets) {
    var translations = _.cloneDeep(tstrings);

    _.forEach(translations.fields, function(field, id) {
        var f = fields[id];
        if (f.keys) {
            field['label#'] = _.each(f.keys).map(function(key) { return key + '=*'; }).join(', ');
            if (!_.isEmpty(field.options)) {
                _.each(field.options, function(v,k) {
                    if (id === 'access') {
                        field.options[k]['title#'] = field.options[k]['description#'] = 'access=' + k;
                    } else {
                        field.options[k + '#'] = k + '=yes';
                    }
                });
            }
        } else if (f.key) {
            field['label#'] = f.key + '=*';
            if (!_.isEmpty(field.options)) {
                _.each(field.options, function(v,k) {
                    field.options[k + '#'] = f.key + '=' + k;
                });
            }
        }

        if (f.placeholder) {
            field['placeholder#'] = id + ' field placeholder';
        }
    });

    _.forEach(translations.presets, function(preset, id) {
        var p = presets[id];
        if (!_.isEmpty(p.tags))
            preset['name#'] = _.toPairs(p.tags).map(function(pair) { return pair[0] + '=' + pair[1]; }).join(', ');
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

function generateTaginfo(presets) {
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

    _.forEach(presets, function(preset) {
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

        taginfo.tags.push(tag);
    });

    return taginfo;
}

function validateCategoryPresets(categories, presets) {
    _.forEach(categories, function(category) {
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
    _.forEach(presets, function(preset) {
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
    _.forEach(defaults.defaults, function (members, name) {
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
