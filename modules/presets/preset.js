import _ from 'lodash';
import { t } from '../util/locale';
import { areaKeys } from '../core/context';


export function presetPreset(id, preset, fields) {
    preset = _.clone(preset);

    preset.id = id;
    preset.fields = (preset.fields || []).map(getFields);
    preset.geometry = (preset.geometry || []);


    function getFields(f) {
        return fields[f];
    }


    preset.matchGeometry = function(geometry) {
        return preset.geometry.indexOf(geometry) >= 0;
    };


    preset.originalScore = preset.matchScore || 1;


    preset.matchScore = function(entity) {
        var tags = preset.tags,
            score = 0;

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


    var name = preset.name || '';
    preset.name = function() {
        if (preset.suggestion) {
            id = id.split('/');
            id = id[0] + '/' + id[1];
            return name + ' - ' + t('presets.presets.' + id + '.name');
        }
        return preset.t('name', {'default': name});
    };


    preset.terms = function() {
        return preset.t('terms', {'default': ''}).toLowerCase().trim().split(/\s*,+\s*/);
    };


    preset.isFallback = function() {
        var tagCount = Object.keys(preset.tags).length;
        return tagCount === 0 || (tagCount === 1 && preset.tags.hasOwnProperty('area'));
    };


    var reference = preset.reference || {};
    preset.reference = function(geometry) {
        var key = reference.key || Object.keys(_.omit(preset.tags, 'name'))[0],
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


    var removeTags = preset.removeTags || preset.tags;
    preset.removeTags = function(tags, geometry) {
        tags = _.omit(tags, _.keys(removeTags));

        for (var f in preset.fields) {
            var field = preset.fields[f];
            if (field.matchGeometry(geometry) && field.default === tags[field.key]) {
                delete tags[field.key];
            }
        }

        delete tags.area;
        return tags;
    };


    var applyTags = preset.addTags || preset.tags;
    preset.applyTags = function(tags, geometry) {
        var k;

        tags = _.clone(tags);

        for (k in applyTags) {
            if (applyTags[k] === '*') {
                tags[k] = 'yes';
            } else {
                tags[k] = applyTags[k];
            }
        }

        // Add area=yes if necessary.
        // This is necessary if the geometry is already an area (e.g. user drew an area) AND any of:
        // 1. chosen preset could be either an area or a line (`barrier=city_wall`)
        // 2. chosen preset doesn't have a key in areaKeys (`railway=station`)
        delete tags.area;
        if (geometry === 'area') {
            var needsAreaTag = true;
            if (preset.geometry.indexOf('line') === -1) {
                for (k in applyTags) {
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
