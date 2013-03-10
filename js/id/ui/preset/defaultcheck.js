iD.ui.preset.defaultcheck = function(form) {

    var event = d3.dispatch('change', 'close'),
        input;

    var check = function(selection) {

        input = selection.append('input')
            .attr('type', 'checkbox')
            .attr('id', 'input-' + form.key)
            .on('change', function() {
                var t = {};
                t[form.key] = input.property('checked') ? form.value || 'yes' : undefined;
                event.change(t);
            });
    };

    check.tags = function(tags) {
        input.property('checked', !!tags[form.key] && tags[form.key] !== 'no');
    };

    return d3.rebind(check, event, 'on');
};
