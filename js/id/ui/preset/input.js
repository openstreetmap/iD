iD.ui.preset.text =
iD.ui.preset.number =
iD.ui.preset.tel =
iD.ui.preset.email =
iD.ui.preset.url = function(form) {

    var event = d3.dispatch('change', 'close'),
        input;

    function i(selection) {
        input = selection.append('input')
            .attr('type', form.type)
            .attr('placeholder', form.placeholder || '')
            .on('blur', change)
            .on('change', change)
            .call(iD.behavior.accept().on('accept', event.close));
    }

    function change() {
        var t = {};
        t[form.key] = input.property('value');
        event.change(t);
    }

    i.tags = function(tags) {
        input.property('value', tags[form.key] || '');
    };

    return d3.rebind(i, event, 'on');
};
