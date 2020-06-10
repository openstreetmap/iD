import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { uiCombobox } from '../combobox';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';
import { t } from '../../core/localizer';

export function uiFieldAccess(field, context) {
    var dispatch = d3_dispatch('change');
    var items = d3_select(null);
    var _tags;

    function access(selection) {
        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        var list = wrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'rows')
            .merge(list);


        items = list.selectAll('li')
            .data(field.keys);

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-access-' + d; });

        enter
            .append('span')
            .attr('class', 'label preset-label-access')
            .attr('for', function(d) { return 'preset-input-access-' + d; })
            .text(function(d) { return field.t('types.' + d); });

        enter
            .append('div')
            .attr('class', 'preset-input-access-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', function(d) { return 'preset-input-access preset-input-access-' + d; })
            .call(utilNoAuto)
            .each(function(d) {
                d3_select(this)
                    .call(uiCombobox(context, 'access-' + d)
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
        var value = context.cleanTagValue(utilGetSetValue(d3_select(this)));

        // don't override multiple values with blank string
        if (!value && typeof _tags[d] !== 'string') return;

        tag[d] = value || undefined;
        dispatch.call('change', this, tag);
    }


    access.options = function(type) {
        var options = ['no', 'permissive', 'private', 'permit', 'destination'];

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


    var placeholdersByHighway = {
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
        _tags = tags;

        utilGetSetValue(items.selectAll('.preset-input-access'), function(d) {
                return typeof tags[d] === 'string' ? tags[d] : '';
            })
            .classed('mixed', function(d) {
                return tags[d] && Array.isArray(tags[d]);
            })
            .attr('title', function(d) {
                return tags[d] && Array.isArray(tags[d]) && tags[d].filter(Boolean).join('\n');
            })
            .attr('placeholder', function(d) {
                if (tags[d] && Array.isArray(tags[d])) {
                    return t('inspector.multiple_values');
                }
                if (d === 'access') {
                    return 'yes';
                }
                if (tags.access && typeof tags.access === 'string') {
                    return tags.access;
                }
                if (tags.highway) {
                    if (typeof tags.highway === 'string') {
                        if (placeholdersByHighway[tags.highway] &&
                            placeholdersByHighway[tags.highway][d]) {

                            return placeholdersByHighway[tags.highway][d];
                        }
                    } else {
                        var impliedAccesses = tags.highway.filter(Boolean).map(function(highwayVal) {
                            return placeholdersByHighway[highwayVal] && placeholdersByHighway[highwayVal][d];
                        }).filter(Boolean);

                        if (impliedAccesses.length === tags.highway.length &&
                            new Set(impliedAccesses).size === 1) {
                            // if all the highway values have the same implied access for this type then use that
                            return impliedAccesses[0];
                        }
                    }
                }
                return field.placeholder();
            });
    };


    access.focus = function() {
        items.selectAll('.preset-input-access')
            .node().focus();
    };


    return utilRebind(access, dispatch, 'on');
}
