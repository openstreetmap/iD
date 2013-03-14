iD.presets.Preset = function(preset, fields) {
    preset = _.clone(preset);

    preset.fields = (preset.fields || []).map(getFields);
    preset.additional = (preset.additional || []).map(getFields);

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
                score++;
            } else if (tags[t] === '*' && t in entity.tags) {
                score += 0.5;
            } else {
                return -1;
            }
        }
        return score;
    };

    preset.removeTags = function(tags, geometry) {
        tags = _.omit(tags, _.keys(preset.tags));

        for (var i in preset.fields) {
            var field = preset.fields[i];
            if (field['default'] && field['default'][geometry] == tags[field.key]) {
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
            if (f.key && !tags[f.key] && f['default'] && f['default'][geometry]) {
                tags[f.key] = f['default'][geometry];
            }
        }
        return tags;
    };

    return preset;
};
