import { rebind } from '../../util/rebind';
import { getSetValue } from '../../util/get_set_value';
import { d3combobox } from '../../../js/lib/d3.combobox.js';
import * as d3 from 'd3';
import _ from 'lodash';

export function access(field) {
    var dispatch = d3.dispatch('change'),
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
                    .call(d3combobox()
                        .data(access.options(d)));
            });

        // Update

        wrap.selectAll('.preset-input-access')
            .on('change', change)
            .on('blur', change);
    }

    function change(d) {
        var tag = {};
        tag[d] = getSetValue(d3.select(this)) || undefined;
        dispatch.call("change", this, tag);
    }

    access.options = function(type) {
        var options = ['no', 'permissive', 'private', 'destination'];

        if (type !== 'access') {
            options.unshift('yes');
            options.push('designated');

            if (type === 'bicycle') {
                options.push('dismount');
            }
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
            foot: 'designated',
            motor_vehicle: 'no'
        },
        steps: {
            foot: 'yes',
            motor_vehicle: 'no',
            bicycle: 'no',
            horse: 'no'
        },
        pedestrian: {
            foot: 'yes',
            motor_vehicle: 'no'
        },
        cycleway: {
            motor_vehicle: 'no',
            bicycle: 'designated'
        },
        bridleway: {
            motor_vehicle: 'no',
            horse: 'designated'
        },
        path: {
            foot: 'yes',
            motor_vehicle: 'no',
            bicycle: 'yes',
            horse: 'yes'
        },
        motorway: {
            foot: 'no',
            motor_vehicle: 'yes',
            bicycle: 'no',
            horse: 'no'
        },
        trunk: {
            motor_vehicle: 'yes'
        },
        primary: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        secondary: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        tertiary: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        residential: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        unclassified: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        service: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        motorway_link: {
            foot: 'no',
            motor_vehicle: 'yes',
            bicycle: 'no',
            horse: 'no'
        },
        trunk_link: {
            motor_vehicle: 'yes'
        },
        primary_link: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        secondary_link: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        },
        tertiary_link: {
            foot: 'yes',
            motor_vehicle: 'yes',
            bicycle: 'yes',
            horse: 'yes'
        }
    };

    access.tags = function(tags) {
        getSetValue(items.selectAll('.preset-input-access'),
            function(d) { return tags[d] || ''; })
            .attr('placeholder', function() {
                return tags.access ? tags.access : field.placeholder();
            });

        // items.selectAll('#preset-input-access-access')
        //     .attr('placeholder', 'yes');

        _.forEach(placeholders[tags.highway], function(v, k) {
            items.selectAll('#preset-input-access-' + k)
                .attr('placeholder', function() { return (tags.access || v); });
        });
    };

    access.focus = function() {
        items.selectAll('.preset-input-access')
            .node().focus();
    };

    return rebind(access, dispatch, 'on');
}
