iD.presets.Preset = function(id, preset, fields) {
    preset = _.clone(preset);

    preset.id = id;
    preset.fields = (preset.fields || []).map(getFields);

    function getFields(f) {
        return fields[f];
    }

    preset.matchGeometry = function(entity, resolver) {
        return preset.geometry.indexOf(entity.geometry(resolver)) >= 0;
    };

    preset.matchTags = function(entity) {
        var tags = preset.tags,
            score = 0;
        for (var t in tags) {
            if (entity.tags[t] === tags[t]) {
                if (t === 'area') {
                    // score area tag lower to prevent other/area preset
                    // from being chosen over something more specific
                    score += 0.5;
                } else {
                    score += 1;
                }
            } else if (tags[t] === '*' && t in entity.tags) {
                score += 0.5;
            } else {
                return -1;
            }
        }
        return score;
    };

    preset.t = function(scope, options) {
        return t('presets.presets.' + id + '.' + scope, options);
    };

    preset.name = function() {
        return preset.t('name', {'default': id});
    };

    preset.terms = function() {
        return preset.t('terms', {'default': ''}).split(',');
    };

    preset.removeTags = function(tags, geometry) {
        tags = _.omit(tags, _.keys(preset.tags));

        for (var i in preset.fields) {
            var field = preset.fields[i];
            if (field.matchGeometry(geometry) && field['default'] === tags[field.key]) {
                delete tags[field.key];
            }
        }
        return tags;

    };

    preset.applyTags = function(tags, geometry) {
        for (var k in preset.tags) {
            if (preset.tags[k] !== '*') tags[k] = preset.tags[k];
        }

        for (var f in preset.fields) {
            f = preset.fields[f];
            if (f.matchGeometry(geometry) && f.key && !tags[f.key] && f['default']) {
                tags[f.key] = f['default'];
            }
        }
        return tags;
    };

    return preset;
};
