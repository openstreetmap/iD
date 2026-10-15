import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { uiCombobox } from '../combobox';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';
import { t } from '../../core/localizer';
import { formatTag } from './tag_title';
import type { CreateUiField, FieldImpl } from '../field';

interface AccessFieldImpl extends FieldImpl {
    options(key: TagKey): void;
}

export const uiFieldAccess: CreateUiField = (field, context) => {
    var dispatch = d3_dispatch('change');
    var items = d3_select<HTMLLIElement, TagKey>(null!);
    var _tags: TagsMulti;

    const access: AccessFieldImpl = function access(selection) {
        var wrap = selection.selectAll<HTMLDivElement, 0>('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        var list = wrap.selectAll<HTMLUListElement, 0>('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'rows')
            .merge(list);


        items = list.selectAll<HTMLLIElement, string>('li')
            .data(field.keys!);

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-access-' + d; });

        enter
            .append('div')
            .attr('class', 'label preset-label-access')
            .attr('for', function(d) { return 'preset-input-access-' + d; })
            .each(function(d) {
                d3_select(this).call(
                    field.t.append('types.' + d));
            });

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
                    , d3_select(this.parentNode!.parentNode as HTMLElement));
            });


        // Update
        items = items.merge(enter);

        wrap.selectAll<HTMLInputElement, TagKey>('.preset-input-access')
            .on('change', change)
            .on('blur', change);
    };


    function change(this: any, d3_event: Event, d: TagKey) {
        var tag: TagsUpdate = {};
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
                title: formatTag(type, option),
                description: field.hasTextForStringId('options.' + option + '.description')
                    ? field.t('options.' + option + '.description') : undefined,
                value: option
            };
        });
    };

    const placeholdersByTag: Record<TagKey, Record<TagValue, Record<TagKey, TagValue>>> = {
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
            ladder: {
                foot: 'yes',
                motor_vehicle: 'no',
                bicycle: 'no',
                horse: 'no'
            },
            pedestrian: {
                foot: 'yes',
                motor_vehicle: 'no'
            },
            living_street: {
                foot: 'yes'
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
            },
            busway: {
                access: 'no',
                bus: 'designated',
                emergency: 'yes',
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

        utilGetSetValue(items.selectAll<HTMLInputElement, TagKey>('.preset-input-access'), function(d: TagKey) {
                return typeof tags[d] === 'string' ? tags[d] : '';
            })
            .classed('mixed', function(accessField) {
                return tags[accessField] && Array.isArray(tags[accessField])
                    || new Set(getAllPlaceholders(tags, accessField)).size > 1;
            })
            .attr('title', function(accessField) {
                return tags[accessField] && Array.isArray(tags[accessField]) && tags[accessField].filter(Boolean).join('\n');
            })
            .attr('placeholder', function(accessField) {
                let placeholders = getAllPlaceholders(tags, accessField);
                if (new Set(placeholders).size === 1) {
                    // all objects have the same implied access
                    return placeholders[0];
                } else {
                    return t('inspector.multiple_values');
                }
            });

            function getAllPlaceholders(tags: TagsMulti & WithSymbol, accessField: TagKey) {
                let allTags = tags[Symbol.for('allTags')];
                if (allTags && allTags.length > 1) {
                    // multi selection
                    const placeholders: (string | string[])[] = [];
                    allTags.forEach(tags => {
                        placeholders.push(getPlaceholder(tags, accessField));
                    });
                    return placeholders;
                } else {
                    return [getPlaceholder(tags, accessField)];
                }
            }

            function getPlaceholder(tags: TagsMulti, accessField: TagKey) {
                if (tags[accessField]) {
                    return tags[accessField];
                }
                // implied access
                // motorroad: https://wiki.openstreetmap.org/wiki/OSM_tags_for_routing/Access_restrictions
                if (tags.motorroad === 'yes' && (accessField === 'foot' || accessField === 'bicycle' || accessField === 'horse')) {
                    return 'no';
                }
                // inherited access
                if (tags.vehicle && (accessField === 'bicycle' || accessField === 'motor_vehicle')) {
                    return tags.vehicle;
                }
                if (tags.access) {
                    return tags.access;
                }
                // default access by road/barrier type
                for (const key in placeholdersByTag) {
                    if (typeof tags[key] === 'string') {
                        if (placeholdersByTag[key][tags[key]] &&
                            placeholdersByTag[key][tags[key]][accessField]) {
                            return placeholdersByTag[key][tags[key]][accessField];
                        }
                    }
                }
                if (accessField === 'access' && !tags.barrier) {
                    return 'yes';
                }
                return field.placeholder();
            }
    } as AccessFieldImpl['tags'];


    access.focus = function() {
        items.selectAll<HTMLElement, unknown>('.preset-input-access')
            .node()!.focus();
    };


    access.on = dispatch.on;
    return utilRebind(access, dispatch, 'on');
};
