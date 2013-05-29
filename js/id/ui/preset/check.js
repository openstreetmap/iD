iD.ui.preset.check = function(field) {
    var event = d3.dispatch('change'),
        values = [undefined, 'yes', 'no'],
        value,
        box,
        text,
        label;

    var check = function(selection) {
        selection.classed('checkselect', 'true');

        label = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = label.enter().append('label')
            .attr('class', 'preset-input-wrap');

        enter.append('input')
            .property('indeterminate', true)
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);

        enter.append('span')
            .text(t('inspector.unknown'))
            .attr('class', 'value');

        box = label.select('input')
            .on('click', function() {
                var t = {};
                t[field.key] = values[(values.indexOf(value) + 1) % 3];
                event.change(t);
                d3.event.stopPropagation();
            });

        text = label.select('span.value');
    };

    check.tags = function(tags) {
        value = tags[field.key];
        box.property('indeterminate', !value);
        box.property('checked', value === 'yes');
        text.text(value || t('inspector.unknown'));
        label.classed('set', !!value);
    };

    check.focus = function() {
        box.node().focus();
    };

    return d3.rebind(check, event, 'on');
};
