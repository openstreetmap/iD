iD.ui.preset.combo =
iD.ui.preset.typeCombo = function(field) {
    var event = d3.dispatch('change'),
        input;

    function combo(selection) {
        var combobox = d3.combobox();

        input = selection.selectAll('input')
            .data([0]);

        input.enter().append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id);

        input
            .on('change', change)
            .on('blur', change)
            .each(function() {
                if (field.options) {
                    options(field.options);
                } else {
                    iD.taginfo().values({
                        key: field.key
                    }, function(err, data) {
                        if (!err) options(_.pluck(data, 'value'));
                    });
                }
            })
            .call(combobox);

        function options(opts) {
            combobox.data(opts.map(function(d) {
                var o = {};
                o.title = o.value = d.replace('_', ' ');
                return o;
            }));

            input.attr('placeholder', function() {
                if (opts.length < 3) return '';
                return opts.slice(0, 3).join(', ') + '...';
            });
        }
    }

    function change() {
        var value = input.value().replace(' ', '_');
        if (field.type === 'typeCombo' && !value) value = 'yes';

        var t = {};
        t[field.key] = value || undefined;
        event.change(t);
    }

    combo.tags = function(tags) {
        var value = tags[field.key] || '';
        if (field.type === 'typeCombo' && value === 'yes') value = '';
        input.value(value);
    };

    combo.focus = function() {
        input.node().focus();
    };

    return d3.rebind(combo, event, 'on');
};
