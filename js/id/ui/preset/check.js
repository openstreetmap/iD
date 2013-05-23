iD.ui.preset.check = function(field) {

    var event = d3.dispatch('change'),
        values = ['', 'yes', 'no'],
        value = '',
        box,
        text,
        label;

    var check = function(selection) {

        selection.classed('checkselect', 'true');

        label = selection.append('label')
            .attr('class', 'preset-input-wrap');

        box = label.append('input')
            .property('indeterminate', true)
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);

        text = label.append('span')
            .text('unknown')
            .attr('class', 'value');

        box.on('click', function() {
            var t = {};
            t[field.key] = values[(values.indexOf(value) + 1) % 3];
            check.tags(t);
            event.change(t);
            d3.event.stopPropagation();
        });
    };

    check.tags = function(tags) {
        value = tags[field.key] || '';
        box.property('indeterminate', !value);
        box.property('checked', value === 'yes');
        text.text(value || 'unknown');
        label.classed('set', !!value);
    };

    check.focus = function() {
        box.node().focus();
    };

    return d3.rebind(check, event, 'on');
};
