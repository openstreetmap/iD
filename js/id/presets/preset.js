iD.presets.Preset = function(preset, forms) {

    preset.form = preset.form.map(function(f) {
        if (typeof f === 'string') {
            return forms[f];
        } else {
            return f;
        }
    });

    preset.matchType = function(entity, resolver) {
        return preset.match.type.indexOf(entity.geometry(resolver)) >= 0;
    };

    preset.matchTags = function(entity) {
        var tags = preset.match.tags;
        for (var t in tags) {
            if (entity.tags[t] !== tags[t] &&
                !(tags[t] === '*' && t in entity.tags)) return -1;
        }
        return Object.keys(preset.match.tags).length;
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
    };

    return preset;
};
