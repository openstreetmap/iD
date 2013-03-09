iD.ui.preset.check = function() {

    var event = d3.dispatch('change', 'close'),
        values = ['', 'yes', 'no'],
        value,
        box,
        text,
        label;

    var check = function(selection) {

        selection.classed('checkselect', 'true');

        label = selection.append('label');

        box = label.append('input')
            .attr('type', 'checkbox');

        text = label.append('span')
            .attr('class', 'value');

        box.on('click', function() {
            check.value(values[(values.indexOf(value) + 1) % 3]);
            event.change(value);
            d3.event.stopPropagation();
        });

        check.value();
    };

    check.value = function(v) {
        value = v || '';
        box.property('indeterminate', !value);
        box.property('checked', value === 'yes');
        text.text(value || 'unknown');
        label.classed('set', !!value);
    };

    return d3.rebind(check, event, 'on');
};
