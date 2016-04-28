iD.ui.preset.combo =
iD.ui.preset.typeCombo = function(field, context) {
    var dispatch = d3.dispatch('change'),
        optstrings = field.strings && field.strings.options,
        optarray = field.options,
        snake_case = (field.snake_case || (field.snake_case === undefined)),
        strings = {},
        input,
        entity;

    function snake(s) {
        return s.replace(/\s+/g, '_');
    }

    function unsnake(s) {
        return s.replace(/_+/g, ' ');
    }

    function clean(s) {
        return s.split(';')
            .map(function(s) { return s.trim(); })
            .join(';');
    }

    function optString() {
        return _.find(_.keys(strings), function(k) {
                return strings[k] === input.value();
            });
    }

    function initCombo(selection) {
        var d;

        if (optstrings) {
            selection.attr('readonly', 'readonly');
            d = Object.keys(optstrings).map(function(k) {
                var v = field.t('options.' + k, { 'default': optstrings[k] });
                return {
                    key: k,
                    value: v,
                    title: v
                };
            });
            selection.call(d3.combobox().data(d));
            setPlaceholders(d);

        } else if (optarray) {
            d = optarray.map(function(k) {
                var v = snake_case ? unsnake(k) : k;
                return {
                    key: k,
                    value: v,
                    title: v
                };
            });
            selection.call(d3.combobox().data(d));
            setPlaceholders(d);

        } else if (context.taginfo()) {
            selection.call(d3.combobox().fetcher(taginfoValues));
            taginfoValues('', setPlaceholders);
        }
    }

    function taginfoValues(q, callback) {
        context.taginfo().values({
            debounce: true,
            key: field.key,
            geometry: context.geometry(entity.id),
            query: q
        }, function(err, data) {
            if (err) return;
            var d = _.pluck(data, 'value').map(function(k) {
                var v = snake_case ? unsnake(k) : k;
                return {
                    key: k,
                    value: v,
                    title: v
                };
            });
            callback(d);
        });
    }

    function setPlaceholders(d) {
        var vals = _.pluck(d, 'value').filter(function(s) { return s.length < 20; }),
            placeholders = vals.length > 1 ? vals : _.pluck(d, 'key');

        input.attr('placeholder', field.placeholder() ||
            (placeholders.slice(0, 3).join(', ') + '…'));
    }

    function change() {
        var value = optString() || clean(input.value());

        if (snake_case) {
            value = snake(value);
        }
        if (field.type === 'typeCombo' && !value) {
            value = 'yes';
        }

        var t = {};
        t[field.key] = value || undefined;
        dispatch.change(t);
    }


    function combo(selection) {
        input = selection.selectAll('input')
            .data([0]);

        input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .call(initCombo);

        input
            .on('change', change)
            .on('blur', change);
    }

    combo.tags = function(tags) {
        var key = tags[field.key],
            optstring = optString(),
            value = strings[key] || key || '';

        if (field.type === 'typeCombo' && value.toLowerCase() === 'yes') {
            value = '';
        }
        if (!optstring && snake_case) {
            value = unsnake(value);
        }
        input.value(value);
    };

    combo.focus = function() {
        input.node().focus();
    };

    combo.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return combo;
    };

    return d3.rebind(combo, dispatch, 'on');
};
