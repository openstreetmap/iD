iD.presets.Preset = function(id, preset, fields) {
    preset = _.clone(preset);

    preset.id = id;
    preset.fields = (preset.fields || []).map(getFields);

    function getFields(f) {
        return fields[f];
    }

    preset.matchGeometry = function(geometry) {
        return preset.geometry.indexOf(geometry) >= 0;
    };

    var matchScore = preset.matchScore || 1;
    preset.matchScore = function(entity) {
        var tags = preset.tags,
            score = 0;

        for (var t in tags) {
            if (entity.tags[t] === tags[t]) {
                score += matchScore;
            } else if (tags[t] === '*' && t in entity.tags) {
                score += matchScore / 2;
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

    preset.isFallback = function() {
        return Object.keys(preset.tags).length === 0;
    };

    preset.reference = function(geometry) {
        var key = Object.keys(preset.tags)[0];

        if (geometry === 'relation' && key === 'type') {
            return {rtype: preset.tags[key]};
        }
        
        var reference = {key: key};

        if (preset.tags[reference.key] !== '*') {
            reference.value = preset.tags[reference.key];
        }

        return reference;
    };

    var removeTags = preset.removeTags || preset.tags;
    preset.removeTags = function(tags, geometry) {
        tags = _.omit(tags, _.keys(removeTags));

        for (var f in preset.fields) {
            var field = preset.fields[f];
            if (field.matchGeometry(geometry) && field['default'] === tags[field.key]) {
                delete tags[field.key];
            }
        }

        return tags;
    };

    var applyTags = preset.applyTags || preset.tags;
    preset.applyTags = function(tags, geometry) {
        tags = _.clone(tags);

        for (var k in applyTags) {
            if (applyTags[k] === '*') {
                tags[k] = 'yes';
            } else {
                tags[k] = applyTags[k];
            }
        }

        for (var f in preset.fields) {
            var field = preset.fields[f];
            if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field['default']) {
                tags[field.key] = field['default'];
            }
        }

        return tags;
    };

    return preset;
};
