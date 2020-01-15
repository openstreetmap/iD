import { t } from '../util/locale';
import { osmAreaKeys } from '../osm/tags';
import { utilArrayUniq, utilObjectOmit } from '../util';
import { utilSafeClassName } from '../util/util';


export function presetPreset(id, preset, fields, addable, rawPresets) {
    preset = Object.assign({}, preset);   // shallow copy

    preset.id = id;

    // for use in classes, element ids, css selectors
    preset.safeid = utilSafeClassName(id);

    preset.parentPresetID = function() {
        var endIndex = preset.id.lastIndexOf('/');
        if (endIndex < 0) return null;

        return preset.id.substring(0, endIndex);
    };


    // For a preset without fields, use the fields of the parent preset.
    // Replace {preset} placeholders with the fields of the specified presets.
    function resolveFieldInheritance() {

        // Skip `fields` for the keys which define the preset.
        // These are usually `typeCombo` fields like `shop=*`
        function shouldInheritFieldWithID(fieldID) {
            var f = fields[fieldID];
            if (f.key) {
                if (preset.tags[f.key] !== undefined &&
                    // inherit anyway if multiple values are allowed or just a checkbox
                    f.type !== 'multiCombo' && f.type !== 'semiCombo' && f.type !== 'check') {
                    return false;
                }
            }
            return true;
        }

        // returns an array of field IDs to inherit from the given presetID, if found
        function inheritedFieldIDs(presetID, prop) {
            if (!presetID) return null;

            var inheritPreset = rawPresets[presetID];
            if (!inheritPreset) return null;

            var inheritFieldIDs = inheritPreset[prop] || [];

            if (prop === 'fields') {
                inheritFieldIDs = inheritFieldIDs.filter(shouldInheritFieldWithID);
            }

            return inheritFieldIDs;
        }


        ['fields', 'moreFields'].forEach(function(prop) {
            var fieldIDs = [];
            if (preset[prop] && preset[prop].length) {    // fields were defined
                preset[prop].forEach(function(fieldID) {
                    var match = fieldID.match(/\{(.*)\}/);
                    if (match !== null) {        // presetID wrapped in braces {}
                        var inheritIDs = inheritedFieldIDs(match[1], prop);
                        if (inheritIDs !== null) {
                            fieldIDs = fieldIDs.concat(inheritIDs);
                        } else {
                            /* eslint-disable no-console */
                            console.log('Cannot resolve presetID ' + match[0] +
                                ' found in ' + preset.id + ' ' + prop);
                            /* eslint-enable no-console */
                        }
                    } else {
                        fieldIDs.push(fieldID);  // no braces - just a normal field
                    }
                });

            } else {  // no fields defined, so use the parent's if possible
                fieldIDs = inheritedFieldIDs(preset.parentPresetID(), prop);
            }
            // resolve duplicate fields
            fieldIDs = utilArrayUniq(fieldIDs);

            // update this preset with the results
            preset[prop] = fieldIDs;

            // update the raw object to allow for multiple levels of inheritance
            rawPresets[preset.id][prop] = fieldIDs;
        });
    }

    if (rawPresets) {
        resolveFieldInheritance();
    }

    preset.fields = (preset.fields || []).map(getFields);
    preset.moreFields = (preset.moreFields || []).map(getFields);
    preset.geometry = (preset.geometry || []);

    addable = addable || false;

    function getFields(f) {
        return fields[f];
    }


    preset.matchGeometry = function(geometry) {
        return preset.geometry.indexOf(geometry) >= 0;
    };


    preset.originalScore = preset.matchScore || 1;


    preset.matchScore = function(entityTags) {
        var tags = preset.tags;
        var seen = {};
        var score = 0;
        var k;

        // match on tags
        for (k in tags) {
            seen[k] = true;
            if (entityTags[k] === tags[k]) {
                score += preset.originalScore;
            } else if (tags[k] === '*' && k in entityTags) {
                score += preset.originalScore / 2;
            } else {
                return -1;
            }
        }

        // boost score for additional matches in addTags - #6802
        var addTags = preset.addTags;
        for (k in addTags) {
            if (!seen[k] && entityTags[k] === addTags[k]) {
                score += preset.originalScore;
            }
        }

        return score;
    };


    var _textCache = {};

    preset.t = function(scope, options) {
        var textID = 'presets.presets.' + id + '.' + scope;

        if (_textCache[textID]) return _textCache[textID];

        var text = t(textID, options);
        _textCache[textID] = text;
        return text;
    };


    preset.originalName = preset.name || '';


    preset.name = function() {
        if (preset.suggestion) {
            var path = id.split('/');
            path.pop();  // remove brand name
            // NOTE: insert an en-dash, not a hypen (to avoid conflict with fr - nl names in Brussels etc)
            return preset.originalName + ' – ' + t('presets.presets.' + path.join('/') + '.name');
        }
        return preset.t('name', { 'default': preset.originalName });
    };


    preset.originalTerms = (preset.terms || []).join();


    preset.terms = function() {
        return preset.t('terms', { 'default': preset.originalTerms }).toLowerCase().trim().split(/\s*,+\s*/);
    };


    preset.isFallback = function() {
        var tagCount = Object.keys(preset.tags).length;
        return tagCount === 0 || (tagCount === 1 && preset.tags.hasOwnProperty('area'));
    };

    preset.addable = function(val) {
        if (!arguments.length) return addable;
        addable = val;
        return addable;
    };


    var reference = preset.reference || {};
    preset.reference = function(geometry) {
        // Lookup documentation on Wikidata...
        var qid = preset.tags.wikidata || preset.tags['brand:wikidata'] || preset.tags['operator:wikidata'];
        if (qid) {
            return { qid: qid };
        }

        // Lookup documentation on OSM Wikibase...
        var key = reference.key || Object.keys(utilObjectOmit(preset.tags, 'name'))[0];
        var value = reference.value || preset.tags[key];

        if (geometry === 'relation' && key === 'type') {
            if (value in preset.tags) {
                key = value;
                value = preset.tags[key];
            } else {
                return { rtype: value };
            }
        }

        if (value === '*') {
            return { key: key };
        } else {
            return { key: key, value: value };
        }
    };


    preset.removeTags = preset.removeTags || preset.addTags || preset.tags || {};
    preset.unsetTags = function(tags, geometry) {
        tags = utilObjectOmit(tags, Object.keys(preset.removeTags));

        for (var f in preset.fields) {
            var field = preset.fields[f];
            if (field.matchGeometry(geometry) && field.default === tags[field.key]) {
                delete tags[field.key];
            }
        }

        delete tags.area;
        return tags;
    };


    preset.addTags = preset.addTags || preset.tags || {};
    preset.setTags = function(tags, geometry, skipFieldDefaults) {
        var addTags = preset.addTags;
        var k;

        tags = Object.assign({}, tags);   // shallow copy

        for (k in addTags) {
            if (addTags[k] === '*') {
                tags[k] = 'yes';
            } else {
                tags[k] = addTags[k];
            }
        }

        // Add area=yes if necessary.
        // This is necessary if the geometry is already an area (e.g. user drew an area) AND any of:
        // 1. chosen preset could be either an area or a line (`barrier=city_wall`)
        // 2. chosen preset doesn't have a key in osmAreaKeys (`railway=station`)
        if (!addTags.hasOwnProperty('area')) {
            delete tags.area;
            if (geometry === 'area') {
                var needsAreaTag = true;
                if (preset.geometry.indexOf('line') === -1) {
                    for (k in addTags) {
                        if (k in osmAreaKeys) {
                            needsAreaTag = false;
                            break;
                        }
                    }
                }
                if (needsAreaTag) {
                    tags.area = 'yes';
                }
            }
        }
        if (geometry && !skipFieldDefaults) {
            for (var f in preset.fields) {
                var field = preset.fields[f];
                if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field.default) {
                    tags[field.key] = field.default;
                }
            }
        }

        return tags;
    };


    return preset;
}
