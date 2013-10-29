iD.ui.preset.access = function(field) {
    var event = d3.dispatch('change'),
        items;

    function access(selection) {
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap.enter().append('div')
            .attr('class', 'cf preset-input-wrap')
            .append('ul');

        items = wrap.select('ul').selectAll('li')
            .data(field.keys);

        // Enter

        var enter = items.enter().append('li')
            .attr('class', function(d) { return 'cf preset-access-' + d; });

        enter.append('span')
            .attr('class', 'col6 label preset-label-access')
            .attr('for', function(d) { return 'preset-input-access-' + d; })
            .text(function(d) { return field.t('types.' + d); });

        enter.append('div')
            .attr('class', 'col6 preset-input-access-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'preset-input-access')
            .attr('id', function(d) { return 'preset-input-access-' + d; })
            .each(function(d) {
                d3.select(this)
                    .call(d3.combobox()
                        .data(access.options(d)));
            });

        // Update

        wrap.selectAll('.preset-input-access')
            .on('change', change)
            .on('blur', change);
    }

    function change(d) {
        var tag = {};
        tag[d] = d3.select(this).value() || undefined;
        event.change(tag);
    }

    access.options = function(type) {
        var options = ['no', 'permissive', 'private', 'designated', 'destination'];

        if (type !== 'access') {
            options.unshift('yes');
        }

        return options.map(function(option) {
            return {
                title: field.t('options.' + option + '.description'),
                value: option
            };
        });
    };

    var placeholders = {
        footway: {
            foot: 'yes',
            motor_vehicle: 'no'
        },
        steps: {
            foot: 'yes',
            motor_vehicle: 'no'
        },
        pedestrian: {
            foot: 'yes',
            motor_vehicle: 'no'
        },
        cycleway: {
            bicycle: 'yes',
            motor_vehicle: 'no'
        },
        bridleway: {
            horse: 'yes'
        },
        path: {
            motor_vehicle: 'no'
        },
        motorway: {
            motor_vehicle: 'yes'
        },
        trunk: {
            motor_vehicle: 'yes'
        },
        primary: {
            motor_vehicle: 'yes'
        },
        secondary: {
            motor_vehicle: 'yes'
        },
        tertiary: {
            motor_vehicle: 'yes'
        },
        residential: {
            motor_vehicle: 'yes'
        },
        unclassified: {
            motor_vehicle: 'yes'
        },
        service: {
            motor_vehicle: 'yes'
        },
        motorway_link: {
            motor_vehicle: 'yes'
        },
        trunk_link: {
            motor_vehicle: 'yes'
        },
        primary_link: {
            motor_vehicle: 'yes'
        },
        secondary_link: {
            motor_vehicle: 'yes'
        },
        tertiary_link: {
            motor_vehicle: 'yes'
        }
    };

    access.tags = function(tags) {
        items.selectAll('.preset-input-access')
            .value(function(d) { return tags[d] || ''; })
            .attr('placeholder', function() {
                return tags.access ? tags.access : field.placeholder();
            });

        items.selectAll('#preset-input-access-access')
            .attr('placeholder', 'yes');

        _.forEach(placeholders[tags.highway], function(value, key) {
            items.selectAll('#preset-input-access-' + key)
                .attr('placeholder', value);
        });
    };

    access.focus = function() {
        items.selectAll('.preset-input-access')
            .node().focus();
    };

    return d3.rebind(access, event, 'on');
};
