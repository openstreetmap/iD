import _forEach from 'lodash-es/forEach';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { d3combobox as d3_combobox } from '../../lib/d3.combobox.js';

import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export function uiFieldAccess(field, context) {
    var dispatch = d3_dispatch('change'),
        items;

    function access(selection) {
        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'cf preset-input-wrap')
            .append('ul')
            .merge(wrap);

        var list = wrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .merge(list);


        items = list.selectAll('li')
            .data(field.keys);

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'cf preset-access-' + d; });

        enter
            .append('span')
            .attr('class', 'col6 label preset-label-access')
            .attr('for', function(d) { return 'preset-input-access-' + d; })
            .text(function(d) { return field.t('types.' + d); });

        enter
            .append('div')
            .attr('class', 'col6 preset-input-access-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'preset-input-access')
            .attr('id', function(d) { return 'preset-input-access-' + d; })
            .call(utilNoAuto)
            .each(function(d) {
                d3_select(this)
                    .call(d3_combobox()
                        .container(context.container())
                        .data(access.options(d))
                    );
            });


        // Update
        items = items.merge(enter);

        wrap.selectAll('.preset-input-access')
            .on('change', change)
            .on('blur', change);
    }


    function change(d) {
        var tag = {};
        tag[d] = utilGetSetValue(d3_select(this)) || undefined;
        dispatch.call('change', this, tag);
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
        utilGetSetValue(items.selectAll('.preset-input-access'),
            function(d) { return tags[d] || ''; })
            .attr('placeholder', function() {
                return tags.access ? tags.access : field.placeholder();
            });

        items.selectAll('#preset-input-access-access')
            .attr('placeholder', 'yes');

        _forEach(placeholders[tags.highway], function(v, k) {
            items.selectAll('#preset-input-access-' + k)
                .attr('placeholder', function() { return (tags.access || v); });
        });
    };


    access.focus = function() {
        items.selectAll('.preset-input-access')
            .node().focus();
    };


    return utilRebind(access, dispatch, 'on');
}
