iD.ui.preset.check = function(form) {

    var event = d3.dispatch('change', 'close'),
        values = ['', 'yes', 'no'],
        value = '',
        box,
        text,
        label;

    var check = function(selection) {

        selection.classed('checkselect', 'true');

        label = selection.append('label');

        box = label.append('input')
            .property('indeterminate', true)
            .attr('type', 'checkbox');

        text = label.append('span')
            .text('unknown')
            .attr('class', 'value');

        box.on('click', function() {
            var t = {};
            t[form.key] = values[(values.indexOf(value) + 1) % 3];
            check.tags(t);
            event.change(t);
            d3.event.stopPropagation();
        });
    };

    check.tags = function(tags) {
        value = tags[form.key] || '';
        box.property('indeterminate', !value);
        box.property('checked', value === 'yes');
        text.text(value || 'unknown');
        label.classed('set', !!value);
    };

    return d3.rebind(check, event, 'on');
};
