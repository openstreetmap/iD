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
        window.ifNotMap(tags);
        tags.forEach(function(v, k) {
            if (score === -1) { // kind of hack to use forEach
                return;
            }
            if (v === entity.tags.get(k)) {
                score += preset.originalScore;
            } else if (v === '*' && entity.tags.has(k)) {
                score += preset.originalScore / 2;
            } else {
                score = -1;
            }
        });
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
        window.ifNotMap(preset.tags);
        var tagCount = preset.tags.size;
        return tagCount === 0 || (tagCount === 1 && preset.tags.has('area'));
    };


    preset.reference = function(geometry) {
        var key;
        window.ifNotMap(preset.tags);
        preset.tags.forEach(function (v, k) {
            key = k;
        });
        var value = preset.tags.get(key);

        if (geometry === 'relation' && key === 'type') {
            if (preset.tags.has(value)) {
                key = value;
                value = preset.tags.get(key);
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
        window.ifNotMap(tags);
        window.ifNotMap(removeTags);
        if (removeTags instanceof  Map) {
            removeTags.forEach(function (v, k) {
                tags.delete(k); // here
            });
        }
        for (var f in preset.fields) {
            var field = preset.fields[f];
            if (field.matchGeometry(geometry) && field.default === tags.get(field.key)) {
                tags.delete(field.key);
            }
        }

        tags.delete('area');
        return tags;
    };


    var applyTags = preset.addTags || preset.tags;
    preset.applyTags = function(tags, geometry) {
        window.ifNotMap(tags);
        window.ifNotMap(applyTags);

        tags = _.clone(tags);
        var applyTagsKeys = [];
        if (applyTags instanceof  Map) {
            applyTags.forEach(function (v, k) {
                applyTagsKeys.push(k);
                if (applyTags.get(k) === '*') {
                    tags.set(k, 'yes');
                } else {
                    tags.set(k, applyTags.get(k));
                }
            });
        }

        // Add area=yes if necessary.
        // This is necessary if the geometry is already an area (e.g. user drew an area) AND any of:
        // 1. chosen preset could be either an area or a line (`barrier=city_wall`)
        // 2. chosen preset doesn't have a key in areaKeys (`railway=station`)
        if (geometry === 'area') {
            var needsAreaTag = true;
            if (preset.geometry.indexOf('line') === -1) {
                for (var i = 0; i < applyTagsKeys.length; i++) {
                    var k = applyTagsKeys[i];
                    if (k in areaKeys) {
                        needsAreaTag = false;
                        break;
                    }
                }
            }
            if (needsAreaTag) {
                tags.set('area', 'yes');
            }
        }

        for (var f in preset.fields) {
            var field = preset.fields[f];
            if (field.matchGeometry(geometry) && field.key && !tags.get(field.key) && field.default) {
                tags.set(field.key, field.default);
            }
        }

        return tags;
    };


    return preset;
}
