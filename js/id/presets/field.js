iD.presets.Field = function(id, field) {
    field = _.clone(field);

    field.id = id;

    field.matchGeometry = function(geometry) {
        return !field.geometry || field.geometry.indexOf(geometry) >= 0;
    };

    field.t = function(scope, options) {
        return t('presets.fields.' + id + '.' + scope, options);
    };

    field.label = function() {
        return field.t('label', {'default': id});
    };

    var placeholder = field.placeholder;
    field.placeholder = function() {
        return field.t('placeholder', {'default': placeholder});
    };

    return field;
};
