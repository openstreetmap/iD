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
            .html(function(d) { return field.t.html('types.' + d); });

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


    function change(d3_event, d) {
        var tag = {};
        var value = context.cleanTagValue(utilGetSetValue(d3_select(this)));

        // don't override multiple values with blank string
        if (!value && typeof _tags[d] !== 'string') return;

        tag[d] = value || undefined;
        dispatch.call('change', this, tag);
    }


    access.options = function(type) {
        var options = [
            'yes',
            'no',
            'designated',
            'permissive',
            'destination',
            'customers',
            'private',
            'permit',
            'unknown'
        ];

        if (type === 'access') {
            options = options.filter(v => v !== 'yes' && v !== 'designated');
        }
        if (type === 'bicycle') {
            options.splice(options.length - 4, 0, 'dismount');
        }

        return options.map(function(option) {
            return {
                title: field.t('options.' + option + '.description'),
                value: option
            };
        });
    };


    const placeholdersByTag = {
        highway: {
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
            },
            construction: {
                access: 'no'
            }
        },
        barrier: {
            bollard: {
                access: 'no',
                bicycle: 'yes',
                foot: 'yes'
            },
            bus_trap: {
                motor_vehicle: 'no',
                psv: 'yes',
                foot: 'yes',
                bicycle: 'yes'
            },
            city_wall: {
                access: 'no'
            },
            coupure: {
                access: 'yes'
            },
            cycle_barrier: {
                motor_vehicle: 'no'
            },
            ditch: {
                access: 'no'
            },
            entrance: {
                access: 'yes'
            },
            fence: {
                access: 'no'
            },
            hedge: {
                access: 'no'
            },
            jersey_barrier: {
                access: 'no'
            },
            motorcycle_barrier: {
                motor_vehicle: 'no'
            },
            rail_guard: {
                access: 'no'
            }
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
                if (d === 'bicycle' || d === 'motor_vehicle') {
                    if (tags.vehicle && typeof tags.vehicle === 'string') {
                        return tags.vehicle;
                    }
                }
                if (tags.access && typeof tags.access === 'string') {
                    return tags.access;
                }
                function getPlaceholdersByTag(key, placeholdersByKey) {
                    if (typeof tags[key] === 'string') {
                        if (placeholdersByKey[tags[key]] &&
                            placeholdersByKey[tags[key]][d]) {
                            return placeholdersByKey[tags[key]][d];
                        }
                    } else {
                        var impliedAccesses = tags[key].filter(Boolean).map(function(val) {
                            return placeholdersByKey[val] && placeholdersByKey[val][d];
                        }).filter(Boolean);

                        if (impliedAccesses.length === tags[key].length &&
                            new Set(impliedAccesses).size === 1) {
                            // if all the barrier values have the same implied access for this type then use that
                            return impliedAccesses[0];
                        }
                    }
                }
                for (const key in placeholdersByTag) {
                    if (tags[key]) {
                        const impliedAccess = getPlaceholdersByTag(key, placeholdersByTag[key]);
                        if (impliedAccess) {
                            return impliedAccess;
                        }
                    }
                }
                if (d === 'access' && !tags.barrier) {
                    return 'yes';
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
