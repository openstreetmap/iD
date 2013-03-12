iD.presets.Preset = function(preset, forms) {
    preset = _.clone(preset);

    preset.icon = preset.icon || 'marker-stroked';

    preset.form = preset.form ? preset.form.map(getForms) : [];
    preset.additional = preset.additional ? preset.additional.map(getForms) : [];

    function getForms(f) {
        if (typeof f === 'string') {
            return forms[f];
        } else {
            return iD.presets.Form(f, f.key);
        }
    }

    preset.matchGeometry = function(entity, resolver) {
        return preset.match.geometry.indexOf(entity.geometry(resolver)) >= 0;
    };

    preset.matchTags = function(entity) {
        var tags = preset.match.tags,
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
        tags = _.omit(tags, _.keys(preset.match.tags));

        for (var i in preset.form) {
            var field = preset.form[i];
            if (field['default'] && field['default'][geometry] == tags[field.key]) {
                delete tags[field.key];
            }
        }
        return tags;

    };

    preset.applyTags = function(tags, geometry) {
        for (var k in preset.match.tags) {
            if (preset.match.tags[k] !== '*') tags[k] = preset.match.tags[k];
        }

        for (var f in preset.form) {
            f = preset.form[f];
            if (f.key && !tags[f.key] && f['default'] && f['default'][geometry]) {
                tags[f.key] = f['default'][geometry];
            }
        }
        return tags;
    };

    return preset;
};
