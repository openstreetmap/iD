iD.ui.preset.combo = function(field) {

    var event = d3.dispatch('change', 'close'),
        input;

    function combo(selection) {
        var combobox = d3.combobox();

        input = selection.append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
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
        t[field.key] = input.property('value').replace(' ', '_');
        event.change(t);
    }

    combo.tags = function(tags) {
        input.property('value', tags[field.key] || '');
    };

    return d3.rebind(combo, event, 'on');
};
