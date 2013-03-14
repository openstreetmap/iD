iD.presets.Field = function(field, id) {
    field = _.clone(field);

    field.matchGeometry = function(geometry) {
        return !field.geometry || field.geometry.indexOf(geometry) >= 0;
    };

    field.t = function(scope, options) {
        return t('presets.fields.' + id + '.' + scope, options);
    };

    field.label = function() {
        return field.t('label', { 'default': field.key});
    };

    return field;
};
