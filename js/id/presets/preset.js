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

    return preset;
};
