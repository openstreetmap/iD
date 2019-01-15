import _clone from 'lodash-es/clone';
import _omit from 'lodash-es/omit';
import _union from 'lodash-es/union';
import _filter from 'lodash-es/filter';

import { t } from '../util/locale';
import { areaKeys } from '../core/context';


export function presetPreset(id, preset, fields, visible, rawPresets) {
    preset = _clone(preset);

    preset.id = id;

    preset.parentPresetID = function() {
        var endIndex = preset.id.lastIndexOf('/');
        if (endIndex < 0) {
            return null;
        }
        return preset.id.substring(0, endIndex);
    };

    // For a preset without fields, use the fields of the parent preset.
    // Replace {preset} placeholders with the fields of the specified presets.
    function resolveFieldInheritance() {

        function filterTargetFields(targetFieldIDs) {
            // only inherit `fields` that don't define this preset
            return _filter(targetFieldIDs, function(targetFieldID) {
                var targetField = fields[targetFieldID];
                if (targetField.key) {
                    return preset.tags[targetField.key] === undefined;
                }
                return true;
            });
        }

        var betweenBracketsRegex = /([^{]*?)(?=\})/;
        // the keys for properties that contain arrays of field ids
        var fieldKeys = ['fields', 'moreFields'];
        fieldKeys.forEach(function(fieldsKey) {
            if (preset[fieldsKey]) {
                var wrappedTargetPresets = _filter(preset[fieldsKey], function(fieldID) {
                    return fieldID.indexOf('{') > -1;
                });
                wrappedTargetPresets.forEach(function(wrappedTargetPresetID) {
                    var targetPresetID = betweenBracketsRegex.exec(wrappedTargetPresetID)[0];
                    var targetFields = rawPresets[targetPresetID][fieldsKey];
                    if (fieldsKey === 'fields') {
                        targetFields = filterTargetFields(targetFields);
                    }
                    var targetIndex = preset[fieldsKey].indexOf(wrappedTargetPresetID);
                    // replace the {preset} placeholder with the target preset's fields
                    preset[fieldsKey].splice.apply(preset[fieldsKey], [targetIndex, 1].concat(targetFields));
                });
                // remove duplicates
                preset[fieldsKey] = _union(preset[fieldsKey]);
            } else {
                // there are no fields defined, so use the parent's if possible
                var parentPreset = rawPresets[preset.parentPresetID()];
                if (parentPreset && parentPreset[fieldsKey]) {
                    var parentFields = parentPreset[fieldsKey];
                    if (fieldsKey === 'fields') {
                        parentFields = filterTargetFields(parentFields);
                    }
                    preset[fieldsKey] = parentFields;
                }
            }
            // update the raw object to allow for multiple levels of inheritance
            rawPresets[preset.id][fieldsKey] = preset[fieldsKey];
        });
    }
    if (rawPresets) {
        resolveFieldInheritance();
    }

    preset.fields = (preset.fields || []).map(getFields);
    preset.moreFields = (preset.moreFields || []).map(getFields);
    preset.geometry = (preset.geometry || []);

    visible = visible || false;

    function getFields(f) {
        return fields[f];
    }


    preset.matchGeometry = function(geometry) {
        return preset.geometry.indexOf(geometry) >= 0;
    };


    preset.originalScore = preset.matchScore || 1;


    preset.matchScore = function(entity) {
        var tags = preset.tags;
        var score = 0;

        for (var t in tags) {
            if (entity.tags[t] === tags[t]) {
                score += preset.originalScore;
            } else if (tags[t] === '*' && t in entity.tags) {
                score += preset.originalScore / 2;
            } else {
                return -1;
            }
        }

        return score;
    };


    preset.t = function(scope, options) {
        return t('presets.presets.' + id + '.' + scope, options);
    };


    var origName = preset.name || '';
    preset.name = function() {
        if (preset.suggestion) {
            id = id.split('/');
            id = id[0] + '/' + id[1];
            return origName + ' - ' + t('presets.presets.' + id + '.name');
        }
        return preset.t('name', { 'default': origName });
    };

    var origTerms = (preset.terms || []).join();
    preset.terms = function() {
        return preset.t('terms', { 'default': origTerms }).toLowerCase().trim().split(/\s*,+\s*/);
    };


    preset.isFallback = function() {
        var tagCount = Object.keys(preset.tags).length;
        return tagCount === 0 || (tagCount === 1 && preset.tags.hasOwnProperty('area'));
    };

    preset.visible = function(_) {
        if (!arguments.length) return visible;
        visible = _;
        return visible;
    };


    var reference = preset.reference || {};
    preset.reference = function(geometry) {
        var key = reference.key || Object.keys(_omit(preset.tags, 'name'))[0],
            value = reference.value || preset.tags[key];

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


    preset.removeTags = preset.removeTags || preset.tags || {};
    preset.unsetTags = function(tags, geometry) {
        tags = _omit(tags, Object.keys(preset.removeTags));

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
    preset.setTags = function(tags, geometry) {
        var addTags = preset.addTags;
        var k;

        tags = _clone(tags);

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
        // 2. chosen preset doesn't have a key in areaKeys (`railway=station`)
        if (!addTags.hasOwnProperty('area')) {
            delete tags.area;
            if (geometry === 'area') {
                var needsAreaTag = true;
                if (preset.geometry.indexOf('line') === -1) {
                    for (k in addTags) {
                        if (k in areaKeys) {
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

        for (var f in preset.fields) {
            var field = preset.fields[f];
            if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field.default) {
                tags[field.key] = field.default;
            }
        }

        return tags;
    };


    return preset;
}
