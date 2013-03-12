iD.presets.Form = function(form, id) {
    form = _.clone(form);

    form.t = function(scope, options) {
        return t('presets.forms.' + id + '.' + scope, options);
    };

    form.label = function() {
        return form.t('label', {default: form.key});
    };

    return form;
};
