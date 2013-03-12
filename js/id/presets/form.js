iD.presets.Form = function(form, id) {
    form = _.clone(form);

    form.label = function() {
        return t('presets.forms.' + id + '.label', {default: form.key});
    };

    return form;
};
