iD.ui.preset.combo = function(field) {
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
            .call(combobox);

        if (field.options) {
            options(field.options);
        } else {
            iD.taginfo().values({
                key: field.key
            }, function(err, data) {
                if (!err) options(_.pluck(data, 'value'));
            });
        }

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
        var t = {};
        t[field.key] = input.property('value').replace(' ', '_') || undefined;
        event.change(t);
    }

    combo.tags = function(tags) {
        input.property('value', tags[field.key] || '');
    };

    combo.focus = function() {
        input.node().focus();
    };

    return d3.rebind(combo, event, 'on');
};
