iD.ui.preset.combo =
iD.ui.preset.typeCombo = function(field, context) {
    var event = d3.dispatch('change'),
        optstrings = field.strings && field.strings.options,
        optarray = field.options,
        strings = {},
        input;

    function combo(selection) {
        var combobox = d3.combobox();

        input = selection.selectAll('input')
            .data([0]);

        var enter = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id);

        if (optstrings) { enter.attr('readonly', 'readonly'); }

        input
            .call(combobox)
            .on('change', change)
            .on('blur', change)
            .each(function() {
                if (optstrings) {
                    _.each(optstrings, function(v, k) {
                        strings[k] = field.t('options.' + k, { 'default': v });
                    });
                    stringsLoaded();
                } else if (optarray) {
                    _.each(optarray, function(k) {
                        strings[k] = k.replace(/_+/g, ' ');
                    });
                    stringsLoaded();
                } else if (context.taginfo()) {
                    context.taginfo().values({key: field.key}, function(err, data) {
                        if (!err) {
                            _.each(_.pluck(data, 'value'), function(k) {
                                strings[k] = k.replace(/_+/g, ' ');
                            });
                            stringsLoaded();
                        }
                    });
                }
            });

        function stringsLoaded() {
            var keys = _.keys(strings),
                strs = [],
                placeholders;

            combobox.data(keys.map(function(k) {
                var s = strings[k],
                    o = {};
                o.title = o.value = s;
                if (s.length < 20) { strs.push(s); }
                return o;
            }));

            placeholders = strs.length > 1 ? strs : keys;
            input.attr('placeholder', field.placeholder() ||
                (placeholders.slice(0, 3).join(', ') + '...'));
        }
    }

    function change() {
        var optstring = _.find(_.keys(strings), function(k) { return strings[k] === input.value(); }),
            value = optstring || (input.value()
                .split(';')
                .map(function(s) { return s.trim(); })
                .join(';')
                .replace(/\s+/g, '_'));

        if (field.type === 'typeCombo' && !value) value = 'yes';

        var t = {};
        t[field.key] = value || undefined;
        event.change(t);
    }

    combo.tags = function(tags) {
        var key = tags[field.key],
            value = strings[key] || key || '';
        if (field.type === 'typeCombo' && value.toLowerCase() === 'yes') value = '';
        input.value(value);
    };

    combo.focus = function() {
        input.node().focus();
    };

    return d3.rebind(combo, event, 'on');
};
